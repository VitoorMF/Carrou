import { useEffect, useMemo, useRef, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { applyAutoLayoutAsync } from "../../editor/autoLayout";
import { Canvas, type CanvasRef } from "../../editor/canvas/Canvas";
import { type Carousel } from "../../editor/canvas/types";
import { router } from "../../router";
import { db } from "../../services/firebase";
import "./EditPage.css";

type EditorElement = {
    id: string;
    type: string;
    x?: number;
    y?: number;
    prompt?: string;
    src?: string;
    status?: string;
    [key: string]: unknown;
};

type EditorSlide = {
    id: string;
    name: string;
    elements: EditorElement[];
    background?: { type: "solid"; value: string };
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 0.9;
const ZOOM_STEP = 0.05;
const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const GENERATE_IMAGE_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/generateImageForElement"
    : "https://us-central1-carrosselize.cloudfunctions.net/generateImageForElement";

export default function EditPage() {
    const { projectId } = useParams();
    const canvasRef = useRef<CanvasRef>(null);

    const [project, setProject] = useState<any>(null);
    const [projectName, setProjectName] = useState("Projeto sem nome");
    const [carouselData, setCarouselData] = useState<Carousel | null>(null);

    const [slides, setSlides] = useState<EditorSlide[]>([{ id: crypto.randomUUID(), name: "Slide 1", elements: [] }]);
    const [activeSlideId, setActiveSlideId] = useState(slides[0].id);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const [zoom, setZoom] = useState(0.56);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [isReapplyingLayout, setIsReapplyingLayout] = useState(false);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const activeSlide = useMemo(
        () => slides.find((s) => s.id === activeSlideId) ?? slides[0],
        [slides, activeSlideId]
    );

    const activeSlideIndex = useMemo(() => {
        const index = slides.findIndex((s) => s.id === activeSlideId);
        return index !== -1 ? index : 0;
    }, [slides, activeSlideId]);

    function updateSlidesFromCarousel(nextCarousel: Carousel) {
        setCarouselData(nextCarousel);
        const editorSlides = firestoreSlidesToEditorSlides(nextCarousel.slides as any[]);
        const fallbackSlideId = editorSlides[0]?.id ?? crypto.randomUUID();

        setSlides(editorSlides);
        setActiveSlideId((prev) => {
            const exists = editorSlides.some((s) => s.id === prev);
            return exists ? prev : fallbackSlideId;
        });
        setSelectedElementId(null);
    }

    useEffect(() => {
        if (!projectId) {
            setIsLoadingProject(false);
            setErrorMessage("Projeto não encontrado.");
            return;
        }

        setIsLoadingProject(true);
        setErrorMessage(null);

        const ref = doc(db, "projects", projectId);
        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) {
                setProject(null);
                setCarouselData(null);
                setIsLoadingProject(false);
                setErrorMessage("Esse projeto não existe mais.");
                return;
            }

            try {
                const data = snap.data();
                setProject(data);
                setProjectName(data?.meta?.title ?? "Projeto sem nome");

                const raw = projectDocToCarousel(data);
                const computed = await applyAutoLayoutAsync(raw);
                updateSlidesFromCarousel(computed);
                setIsLoadingProject(false);
            } catch (error) {
                console.error(error);
                setIsLoadingProject(false);
                setErrorMessage("Não foi possível montar o layout do projeto.");
            }
        });

        return () => unsub();
    }, [projectId]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
            if (isTyping) {
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                setActiveSlideId(slides[Math.max(activeSlideIndex - 1, 0)]?.id ?? activeSlideId);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                setActiveSlideId(slides[Math.min(activeSlideIndex + 1, slides.length - 1)]?.id ?? activeSlideId);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [slides, activeSlideId, activeSlideIndex]);

    function zoomIn() {
        setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
    }

    function zoomOut() {
        setZoom((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
    }

    function resetZoom() {
        setZoom(0.56);
    }

    function goToSlide(index: number) {
        const next = slides[index];
        if (!next) {
            return;
        }

        setActiveSlideId(next.id);
        setSelectedElementId(null);
    }

    function exportActiveSlide() {
        canvasRef.current?.exportPNG();
        setStatusMessage(`Slide ${activeSlideIndex + 1} exportado.`);
    }

    async function requestImageGeneration(projectIdValue: string, slideId: string, elementId: string) {
        const res = await fetch(GENERATE_IMAGE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: projectIdValue, slideId, elementId }),
        });

        const contentType = res.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json") ? await res.json() : await res.text();

        if (!res.ok) {
            const message = typeof payload === "string" ? payload : payload?.error ?? "Erro ao gerar imagem";
            throw new Error(String(message));
        }

        if (typeof payload !== "object" || !payload || !payload.ok) {
            throw new Error("Erro ao gerar imagem");
        }

        return String(payload.src ?? "");
    }

    async function generateMissingImagesForSlide(slide: EditorSlide) {
        if (!projectId) {
            return;
        }

        const imagesToGenerate = slide.elements.filter((element): element is EditorElement & { prompt: string } => (
            element.type === "image"
            && typeof element.prompt === "string"
            && element.prompt.trim().length > 0
            && !element.src
            && element.status !== "pending"
        ));

        if (imagesToGenerate.length === 0) {
            setStatusMessage("Nenhuma imagem pendente neste slide.");
            return;
        }

        setIsGeneratingImages(true);
        setStatusMessage(`Gerando ${imagesToGenerate.length} imagem(ns) com IA...`);
        setErrorMessage(null);

        for (const element of imagesToGenerate) {
            setSlides((prev) =>
                prev.map((s) =>
                    s.id === slide.id
                        ? {
                            ...s,
                            elements: s.elements.map((ee) =>
                                ee.id === element.id ? { ...ee, status: "pending" } : ee
                            ),
                        }
                        : s
                )
            );

            try {
                const src = await requestImageGeneration(projectId, slide.id, element.id);

                setSlides((prev) =>
                    prev.map((s) =>
                        s.id === slide.id
                            ? {
                                ...s,
                                elements: s.elements.map((ee) =>
                                    ee.id === element.id ? { ...ee, src, status: "ready" } : ee
                                ),
                            }
                            : s
                    )
                );
            } catch (error) {
                console.error(error);
                setSlides((prev) =>
                    prev.map((s) =>
                        s.id === slide.id
                            ? {
                                ...s,
                                elements: s.elements.map((ee) =>
                                    ee.id === element.id ? { ...ee, status: "error" } : ee
                                ),
                            }
                            : s
                    )
                );
                setErrorMessage("Uma ou mais imagens falharam ao gerar.");
            }
        }

        setIsGeneratingImages(false);
        setStatusMessage("Geração de imagens concluída.");
    }

    async function reapplyLayout() {
        if (!carouselData && !project) {
            return;
        }

        try {
            setIsReapplyingLayout(true);
            setErrorMessage(null);

            const sourceCarousel = carouselData ?? projectDocToCarousel(project);
            const computed = await applyAutoLayoutAsync(sourceCarousel);
            updateSlidesFromCarousel(computed);
            setStatusMessage("Layout reaplicado com sucesso.");
        } catch (error) {
            console.error(error);
            setErrorMessage("Não foi possível reaplicar layout.");
        } finally {
            setIsReapplyingLayout(false);
        }
    }

    return (
        <div className="editor_screen">
            <header className="editor_topbar">
                <div className="topbar_group">
                    <button className="back_button" onClick={() => router.navigate("/")} type="button">
                        ← Voltar
                    </button>
                    <input
                        className="project_title"
                        type="text"
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                    />
                </div>

                <div className="topbar_group topbar_center">
                    <div className="topbar_zoom_cluster">
                        <button className="chip_button" type="button" onClick={zoomOut}>
                            -
                        </button>
                        <button className="chip_button chip_button_value" type="button" onClick={resetZoom}>
                            {Math.round(zoom * 100)}%
                        </button>
                        <button className="chip_button" type="button" onClick={zoomIn}>
                            +
                        </button>
                    </div>
                </div>

                <div className="topbar_group topbar_right">
                    <button className="secondary_button" type="button" onClick={reapplyLayout} disabled={isReapplyingLayout || isLoadingProject}>
                        {isReapplyingLayout ? "Aplicando..." : "Reaplicar layout"}
                    </button>
                    <button className="primary_button" type="button" onClick={exportActiveSlide}>
                        Exportar PNG
                    </button>
                </div>
            </header>

            <div className="editor_workspace">
                <aside className="panel panel_left">
                    <div className="panel_title_row">
                        <h3>Páginas</h3>
                        <span>{slides.length}</span>
                    </div>

                    <div className="slides_list">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                className={`slide_item ${slide.id === activeSlideId ? "active" : ""}`}
                                onClick={() => goToSlide(index)}
                                type="button"
                            >
                                <span className="slide_index">{index + 1}</span>
                                <span className="slide_text">{slide.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="left_actions">
                        <button
                            className="secondary_button"
                            type="button"
                            onClick={() => activeSlide && generateMissingImagesForSlide(activeSlide)}
                            disabled={isGeneratingImages || !activeSlide}
                        >
                            {isGeneratingImages ? "Gerando imagens..." : "Gerar imagens IA"}
                        </button>
                    </div>
                </aside>

                <main className="stage_section">
                    <div className="stage_status_bar">
                        <div>
                            Slide {activeSlideIndex + 1} de {slides.length}
                        </div>
                        <div className="status_inline">
                            {isLoadingProject && <span>Carregando projeto...</span>}
                            {!isLoadingProject && statusMessage && <span>{statusMessage}</span>}
                            {errorMessage && <span className="status_error">{errorMessage}</span>}
                        </div>
                    </div>

                    <div className="stage_container">
                        <Canvas
                            ref={canvasRef}
                            carousel={carouselData}
                            slideIndex={activeSlideIndex}
                            zoom={zoom}
                            onExportPNG={() => {
                                setStatusMessage(`Slide ${activeSlideIndex + 1} exportado em PNG.`);
                            }}
                        />
                    </div>
                </main>

                <aside className="panel panel_right">
                    <div className="panel_title_row">
                        <h3>Inspector</h3>
                    </div>

                    <div className="inspector_card">
                        <label>Projeto</label>
                        <p>{projectName}</p>
                    </div>

                    <div className="inspector_card">
                        <label>Slide ativo</label>
                        <p>{activeSlide?.name ?? "Sem slide"}</p>
                    </div>

                    <div className="inspector_card">
                        <label>Elementos</label>
                        <p>{activeSlide?.elements.length ?? 0} itens</p>
                    </div>

                    <div className="elements_list">
                        {(activeSlide?.elements ?? []).slice(0, 10).map((element, index) => (
                            <button
                                className={`element_row ${selectedElementId === element.id ? "active" : ""}`}
                                key={element.id}
                                onClick={() => setSelectedElementId(element.id)}
                                type="button"
                            >
                                <span>{index + 1}</span>
                                <span>{element.type}</span>
                            </button>
                        ))}
                        {(activeSlide?.elements?.length ?? 0) > 10 && (
                            <div className="elements_more">+ {activeSlide.elements.length - 10} elementos</div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function projectDocToCarousel(data: any): Carousel {
    if (Array.isArray(data?.slides) && data.slides.length > 0) {
        return {
            meta: data.meta,
            slides: data.slides,
        } as Carousel;
    }

    if (data?.ai?.normalized?.meta && data?.ai?.normalized?.slides) {
        return data.ai.normalized as Carousel;
    }

    if (data?.ai?.raw?.meta && data?.ai?.raw?.slides) {
        return data.ai.raw as Carousel;
    }

    return {
        meta: data?.meta ?? {},
        slides: data?.slides ?? [],
    } as Carousel;
}

function firestoreSlidesToEditorSlides(rawSlides: any[]): EditorSlide[] {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) {
        return [{ id: crypto.randomUUID(), name: "Slide 1", elements: [] }];
    }

    function extractElements(slide: any): any[] {
        if (Array.isArray(slide?.canvas?.elements)) {
            return slide.canvas.elements;
        }

        if (Array.isArray(slide?.elements)) {
            return slide.elements;
        }

        const layers = slide?.layers;
        if (layers) {
            return [
                ...(Array.isArray(layers.background) ? layers.background : []),
                ...(Array.isArray(layers.atmosphere) ? layers.atmosphere : []),
                ...(Array.isArray(layers.content) ? layers.content : []),
                ...(Array.isArray(layers.ui) ? layers.ui : []),
            ];
        }

        return [];
    }

    return rawSlides.map((slide: any, index: number) => ({
        id: slide?.id ?? `s${index + 1}`,
        name: `Slide ${index + 1}`,
        background:
            slide?.canvas?.background
            ?? (Array.isArray(slide?.layers?.background)
                ? (() => {
                    const bg = slide.layers.background.find((el: any) => el?.type === "background");
                    return bg ? { type: "solid" as const, value: bg.fill ?? "#FFFFFF" } : { type: "solid" as const, value: "#FFFFFF" };
                })()
                : { type: "solid" as const, value: "#FFFFFF" }),
        elements: extractElements(slide)
            .map((el: any): EditorElement | null => {
                if (!el?.id || !el?.type) {
                    return null;
                }

                const base: EditorElement = {
                    id: el.id,
                    type: el.type,
                    x: el.x ?? 0,
                    y: el.y ?? 0,
                    opacity: el.opacity ?? 1,
                };

                if (el.type === "text") {
                    return {
                        ...base,
                        content: el.text ?? el.content ?? "",
                        w: el.w ?? el.width,
                        h: el.h ?? el.height,
                        fontSize: el.fontSize,
                        fontWeight: el.fontWeight,
                        fontFamily: el.fontFamily,
                        fontStyle: el.fontStyle,
                        lineHeight: el.lineHeight,
                        letterSpacing: el.letterSpacing,
                        align: el.align,
                        color: el.color ?? el.fill,
                    };
                }

                if (el.type === "image" || el.type === "backgroundImage") {
                    return {
                        ...base,
                        w: el.w ?? el.width ?? 400,
                        h: el.h ?? el.height ?? 400,
                        src: el.src ?? el.url ?? "",
                        prompt: el.prompt ?? "",
                        fit: el.fit ?? el.cover ?? "cover",
                        pos: el.pos ?? { x: 0.5, y: 0.5 },
                        radius: el.radius ?? el.borderRadius ?? 0,
                        rotate: el.rotate ?? 0,
                    };
                }

                if (el.type === "background") {
                    return {
                        ...base,
                        fill: el.fill ?? "#FFFFFF",
                        w: el.w ?? el.width ?? 1080,
                        h: el.h ?? el.height ?? 1350,
                    };
                }

                if (el.type === "path") {
                    return {
                        ...base,
                        data: el.data ?? "",
                        fill: el.fill ?? "#111827",
                        stroke: el.stroke,
                        strokeWidth: el.strokeWidth,
                    };
                }

                if (el.type === "gradientRect") {
                    return {
                        ...base,
                        w: el.w ?? el.width ?? 1080,
                        h: el.h ?? el.height ?? 1350,
                        kind: el.kind ?? "linear",
                        start: el.start,
                        end: el.end,
                        center: el.center,
                        radius: el.radius,
                        stops: el.stops ?? [],
                    };
                }

                if (el.type === "glow") {
                    return {
                        ...base,
                        r: el.r ?? 120,
                        color: "#F77E58",
                        blur: el.blur ?? 40,
                    };
                }

                if (el.type === "glassCard") {
                    return {
                        ...base,
                        w: el.w ?? el.width ?? 500,
                        h: el.h ?? el.height ?? 260,
                        radius: el.radius ?? 20,
                        fill: el.fill ?? "rgba(255,255,255,0.12)",
                        stroke: el.stroke,
                        strokeWidth: el.strokeWidth,
                    };
                }

                if (el.type === "noise") {
                    return {
                        ...base,
                        w: el.w ?? el.width ?? 1080,
                        h: el.h ?? el.height ?? 1350,
                        src: el.src ?? el.url ?? "",
                    };
                }

                if (el.type === "profileCard") {
                    return {
                        ...base,
                        w: el.w ?? 400,
                        h: el.h ?? 72,
                        variant: el.variant,
                        user: el.user,
                        accent: el.accent,
                        text: el.text,
                    };
                }

                return base;
            })
            .filter((el): el is EditorElement => el !== null),
    }));
}
