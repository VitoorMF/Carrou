import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import "./EditPage.css";
import { db } from "../../services/firebase";
import { useParams } from "react-router-dom";
import { type SlideElement } from "../../editor/SlideRenderer";
import { applyAutoLayoutAsync } from "../../editor/autoLayout";
import { router } from "../../router";
import { type Carousel } from "../../editor/canvas/types";
import { Canvas, type CanvasRef } from "../../editor/canvas/Canvas";


type Slide = {
    id: string;
    name: string;
    elements: SlideElement[];
    background?: { type: "solid"; value: string };
};

export default function EditPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState<any>(null);
    const [projectName, setProjectName] = useState<string>("");

    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const [carouselData, setCarouselData] = useState<Carousel | null>(null);


    const [slides, setSlides] = useState<Slide[]>(() => [
        { id: crypto.randomUUID(), name: "Slide 1", elements: [] },
    ]);

    const [activeSlideId, setActiveSlideId] = useState(slides[0].id);

    const activeSlide = useMemo(() => {
        return slides.find((s) => s.id === activeSlideId) ?? slides[0];
    }, [slides, activeSlideId]);

    // 1. Crie uma ref específica para o componente Canvas
    const canvasComponentRef = useRef<CanvasRef>(null);

    // 2. Crie a função que o botão vai chamar
    function handleSaveClick() {
        // Chama a função exportPNG que está lá dentro do Canvas!
        canvasComponentRef.current?.exportPNG();
    }


    async function requestImageGeneration(projectId: string, slideId: string, elementId: string) {
        const res = await fetch("https://us-central1-carrosselize.cloudfunctions.net/generateImageForElement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, slideId, elementId }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Erro ao gerar imagem");
        return json.src as string;
    }

    async function generateMissingImagesForSlide(projectId: string, slide: Slide) {
        const imgs = slide.elements.filter(
            (e: any) => e.type === "image" && e.prompt && !e.src && e.status !== "pending"
        );

        for (const el of imgs) {
            setSlides((prev) =>
                prev.map((s) =>
                    s.id === slide.id
                        ? {
                            ...s,
                            elements: s.elements.map((ee) =>
                                ee.id === el.id ? { ...ee, status: "pending" } : ee
                            ),
                        }
                        : s
                )
            );

            try {
                const src = await requestImageGeneration(projectId, slide.id, el.id);

                setSlides((prev) =>
                    prev.map((s) =>
                        s.id === slide.id
                            ? {
                                ...s,
                                elements: s.elements.map((ee) =>
                                    ee.id === el.id ? { ...ee, src, status: "ready" } : ee
                                ),
                            }
                            : s
                    )
                );
            } catch (err) {
                setSlides((prev) =>
                    prev.map((s) =>
                        s.id === slide.id
                            ? {
                                ...s,
                                elements: s.elements.map((ee) =>
                                    ee.id === el.id ? { ...ee, status: "error" } : ee
                                ),
                            }
                            : s
                    )
                );
                console.error(err);
            }
        }
    }


    useEffect(() => {
        if (!projectId) return;
        const ref = doc(db, "projects", projectId);

        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) {
                setProject(null);
                setCarouselData(null);
                return;
            }

            const data = snap.data();
            setProject(data);
            setProjectName(data?.meta?.title ?? "Projeto sem nome");

            const raw = projectDocToCarousel(data);
            const computed = await applyAutoLayoutAsync(raw);

            setCarouselData(computed);

            const editorSlides = firestoreSlidesToEditorSlides(computed.slides);
            setSlides(editorSlides);

            setActiveSlideId((prev) => {
                const exists = editorSlides.some((s) => s.id === prev);
                return exists ? prev : editorSlides[0]?.id;
            });

            setSelectedElementId(null);
        });

        return () => unsub();
    }, [projectId]);


    const activeSlideIndex = useMemo(() => {
        const index = slides.findIndex(s => s.id === activeSlideId);
        return index !== -1 ? index : 0;
    }, [slides, activeSlideId]);

    async function reapplyLayout() {
        if (!project) return;

        let compiled;

        const computed = await applyAutoLayoutAsync(compiled); // roda o layout
        const editorSlides = firestoreSlidesToEditorSlides(computed.slides);

        setSlides(editorSlides);

        // tenta manter o slide ativo
        setActiveSlideId((prev) => {
            const exists = editorSlides.some((s) => s.id === prev);
            return exists ? prev : editorSlides[0]?.id;
        });

        setSelectedElementId(null);
    }


    function projectDocToCarousel(data: any): Carousel {
        if (Array.isArray(data?.slides) && data.slides.length > 0) {
            return {
                meta: data.meta,
                slides: data.slides,
            } as Carousel;
        }

        // fallback: if ai.raw exists (generator original), use it
        if (data?.ai?.raw?.meta && data?.ai?.raw?.slides) {
            return data.ai.raw as Carousel;
        }

        // last fallback: empty carousel
        return {
            meta: data?.meta ?? {},
            slides: data?.slides ?? [],
        } as Carousel;
    }

    async function handleFirebaseElements() {
        if (projectId) {
            const docRef = doc(db, "projects", projectId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {

                console.log(JSON.stringify(docSnap.data(), null, 2));
                return JSON.stringify(docSnap.data(), null, 2);

            } else {
                // docSnap.data() will be undefined in this case
                console.log("No such document!");
            }
        }

    }


    return (
        <>
            <div className="edit_header">
                <button className="return" onClick={() => router.navigate("/")}>
                    ← Voltar
                </button>

                <div className="project_name">
                    <span className="project_name_mirror">{projectName || " "}</span>

                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                </div>
            </div>

            <div className="editor_root">
                <aside className="left_bar">

                    <div className="slides_list">
                        <div className="slides">
                            {slides.map((s) => (
                                <button
                                    key={s.id}
                                    className={`slide_btn ${s.id === activeSlideId ? "active" : ""}`}
                                    onClick={() => {
                                        setActiveSlideId(s.id);
                                        setSelectedElementId(null);
                                    }}
                                    type="button"
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="tools_card">
                        <div className="tools_row">
                            <button className="tool_btn" type="button" onClick={() => { }}>button</button>
                            <button className="tool_btn active" type="button" onClick={() => handleFirebaseElements()}>log do json</button>
                            <button className="tool_btn" type="button" onClick={() => { console.log("Firestore host:", (db as any)._delegate?._settings?.host); }}>Demo</button>
                        </div>

                        <button className="ghost_btn" onClick={() => { }} type="button">
                            Adicionar texto
                        </button>
                    </div>

                    <div className="tools_card">
                        <button className="ghost_btn" type="button" onClick={async () => {
                            if (!projectId) return;
                            await generateMissingImagesForSlide(projectId, activeSlide);
                        }}>Gerar imagem com IA</button>
                    </div>

                    <div className="actions_card">
                        <button className="ghost_btn" type="button" onClick={reapplyLayout}>redesenhar</button>
                        <button className="primary_button" type="button" onClick={handleSaveClick}>exportar</button>
                    </div>
                </aside>

                <main className="canvas_area" ref={canvasRef}>
                    <Canvas
                        ref={canvasComponentRef}
                        carousel={carouselData}
                        slideIndex={activeSlideIndex}
                        onExportPNG={(base64Uri: any) => {
                            console.log("Imagem exportada com sucesso!", base64Uri);
                            // Aqui o pai (EditPage) tem acesso à imagem! Você pode, por exemplo, abrir em uma nova aba:
                            const newWindow = window.open();
                            if (newWindow) {
                                newWindow.document.write(`<img src="${base64Uri}" alt="Exported Image"/>`);
                            }
                        }} />
                </main>

                <aside className="right_bar">
                    {selectedElementId ? <p>Editando elemento</p> : <p>Editando fundo</p>}
                </aside>
            </div>
        </>
    );
}


function firestoreSlidesToEditorSlides(rawSlides: any[]): Slide[] {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) {
        return [{ id: crypto.randomUUID(), name: "Slide 1", elements: [] }];
    }

    return rawSlides.map((s: any, idx: number) => ({
        id: s?.id ?? `s${idx + 1}`,
        name: `Slide ${idx + 1}`,
        background: s?.canvas?.background ?? { type: "solid", value: "#FFFFFF" },
        elements: (s.canvas?.elements ?? [])
            .map((el: any) => {
                if (!el?.id || !el?.type) return null;

                if (el.type === "text") {
                    const fw =
                        el.fontWeight === "bold" ? 700 :
                            el.fontWeight === "normal" ? 400 :
                                typeof el.fontWeight === "number" ? el.fontWeight :
                                    400;

                    return {
                        id: el.id,
                        type: "text",
                        x: el.x ?? 0,
                        y: el.y ?? 0,
                        content: el.text ?? el.content ?? "",
                        w: el.w,
                        h: el.h,
                        fontSize: el.fontSize,
                        fontWeight: fw,
                        align: el.align,
                        color: el.color
                    } satisfies SlideElement;
                }

                if (el.type === "icon") {
                    return {
                        id: el.id,
                        type: "icon",
                        x: el.x ?? 0,
                        y: el.y ?? 0,
                        name: el.name,                 // tem que existir no IconMap
                        size: el.size ?? 96,
                        color: el.color,
                    } satisfies SlideElement;
                }

                if (el.type === "shape") {
                    return {
                        id: el.id,
                        type: "shape",
                        x: el.x ?? 0,
                        y: el.y ?? 0,
                        name: el.name,                 // tem que existir no ShapeMap
                        w: el.w ?? 240,
                        h: el.h ?? 240,
                        opacity: el.opacity ?? 0.08,
                        color: el.color,
                        scale: el.scale ?? 1,
                    } satisfies SlideElement;
                }

                if (el.type === "image") {
                    return {
                        id: el.id,
                        type: "image",
                        x: el.x ?? 0,
                        y: el.y ?? 0,
                        w: el.w ?? 400,
                        h: el.h ?? 400,
                        src: el.src ?? "",
                        prompt: el.prompt ?? "",
                        fit: el.fit ?? "cover",
                        pos: el.pos ?? { x: 0.5, y: 0.5 },
                        opacity: el.opacity ?? 1,
                        radius: el.radius ?? 0,
                        rotate: el.rotate ?? 0,
                    } satisfies SlideElement;
                }

                if (el.type === "profileCard") {
                    return {
                        id: el.id,
                        type: "profileCard",
                        x: el.x ?? 0,
                        y: el.y ?? 0,
                        w: el.w ?? 400,
                        h: el.h ?? 72,
                        variant: el.variant,
                        user: el.user,
                        accent: el.accent,
                        text: el.text, // preserve text color from source so renderer doesn't fallback to white
                        opacity: el.opacity ?? 1,
                    } as unknown as SlideElement;
                }

                return null;
            })
            .filter(Boolean) as SlideElement[],
    }));
}
