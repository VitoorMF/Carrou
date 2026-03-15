import { useEffect, useMemo, useRef, useState, type ChangeEvent, type TouchEvent } from "react";
import { onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { Canvas, type CanvasRef } from "../../editor/canvas/Canvas";
import { type Carousel } from "../../editor/canvas/types";
import { useAuth } from "../../lib/hooks/useAuth";
import { applyProfileCardIdentity } from "../../lib/applyProfileCardIdentity";
import { router } from "../../router";
import { auth, db, storage } from "../../services/firebase";
import { findTemplateById, type TemplateId } from "../../templates/templateCatalog";
import type { UserData } from "../../types/userData";
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

type InspectorElementEntry = {
    id: string;
    type: string;
    name?: string;
    layer: "background" | "atmosphere" | "content" | "ui" | "flat";
};

type EditableElementType = "text" | "image" | "backgroundImage";
type MobilePanel = "slides" | "inspector" | null;
type PaletteKey = "bg" | "text" | "muted" | "accent" | "accent2";
type EditorPalette = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};
type PalettePreset = {
    id: string;
    label: string;
    description: string;
    palette: EditorPalette;
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 0.9;
const ZOOM_STEP = 0.05;
const DOC_W = 1080;
const DOC_H = 1350;
const STAGE_PADDING = 40;
const TEMPLATE_PALETTE_PRESETS: Record<TemplateId, PalettePreset[]> = {
    microBlogBold: [
        {
            id: "microblog-paper",
            label: "Paper",
            description: "Claro e editorial",
            palette: {
                bg: "#F5F5F0",
                text: "#0A0A0A",
                muted: "#555555",
                accent: "#2563EB",
                accent2: "#DC2626",
            },
        },
        {
            id: "microblog-night",
            label: "Night",
            description: "Escuro e direto",
            palette: {
                bg: "#0F172A",
                text: "#F8FAFC",
                muted: "#94A3B8",
                accent: "#38BDF8",
                accent2: "#F97316",
            },
        },
        {
            id: "microblog-ink",
            label: "Ink",
            description: "Mais sóbrio e jornal",
            palette: {
                bg: "#F8FAFC",
                text: "#111827",
                muted: "#6B7280",
                accent: "#1D4ED8",
                accent2: "#0F766E",
            },
        },
    ],
    editorial3D: [
        {
            id: "editorial-aqua",
            label: "Aqua",
            description: "Frio e tridimensional",
            palette: {
                bg: "#EFF8F8",
                text: "#393939",
                muted: "#646464",
                accent: "#006884",
                accent2: "#375F65",
            },
        },
        {
            id: "editorial-lilac",
            label: "Lilac",
            description: "Mais experimental",
            palette: {
                bg: "#F4F2FF",
                text: "#221B3A",
                muted: "#7A7396",
                accent: "#6D5EF8",
                accent2: "#EC4899",
            },
        },
        {
            id: "editorial-sand",
            label: "Sand",
            description: "Macio e premium",
            palette: {
                bg: "#FAF4EC",
                text: "#3B2F2F",
                muted: "#8A7469",
                accent: "#C08457",
                accent2: "#6B7280",
            },
        },
    ],
    luxuryMinimal: [
        {
            id: "luxury-gold",
            label: "Gold",
            description: "Clássico premium",
            palette: {
                bg: "#F0EBE1",
                text: "#1A1208",
                muted: "#7A6A55",
                accent: "#C2922A",
                accent2: "#8B4513",
            },
        },
        {
            id: "luxury-noir",
            label: "Noir",
            description: "Luxo mais escuro",
            palette: {
                bg: "#161616",
                text: "#F6F1E8",
                muted: "#B8AFA0",
                accent: "#D4A64A",
                accent2: "#8B5E3C",
            },
        },
        {
            id: "luxury-rose",
            label: "Rose",
            description: "Suave e sofisticado",
            palette: {
                bg: "#F8F2EF",
                text: "#2B1D1A",
                muted: "#8E746A",
                accent: "#C87B6A",
                accent2: "#9A5B4F",
            },
        },
    ],
    streetwearPro: [
        {
            id: "streetwear-fire",
            label: "Fire",
            description: "Contraste alto e energia",
            palette: {
                bg: "#0D0D0D",
                text: "#FFFFFF",
                muted: "#A3A3A3",
                accent: "#FF5500",
                accent2: "#FFD600",
            },
        },
        {
            id: "streetwear-neon",
            label: "Neon",
            description: "Mais urbano e vibrante",
            palette: {
                bg: "#050816",
                text: "#F8FAFC",
                muted: "#94A3B8",
                accent: "#22D3EE",
                accent2: "#F43F5E",
            },
        },
        {
            id: "streetwear-lime",
            label: "Lime",
            description: "Agressivo e moderno",
            palette: {
                bg: "#101010",
                text: "#F5F5F5",
                muted: "#B3B3B3",
                accent: "#A3E635",
                accent2: "#F97316",
            },
        },
    ],
};
const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const GENERATE_IMAGE_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/generateImageForElement"
    : "https://us-central1-carrosselize.cloudfunctions.net/generateImageForElement";
const EXPORT_ZIP_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/southamerica-east1/exportCarouselZip"
    : "https://southamerica-east1-carrosselize.cloudfunctions.net/exportCarouselZip";

export default function EditPage() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const canvasRef = useRef<CanvasRef>(null);
    const stageContainerRef = useRef<HTMLDivElement | null>(null);
    const imagePickerRef = useRef<HTMLInputElement | null>(null);
    const persistTimeoutRef = useRef<number | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

    const [projectName, setProjectName] = useState("Projeto sem nome");
    const [serverCarousel, setServerCarousel] = useState<Carousel | null>(null);
    const [originalPalette, setOriginalPalette] = useState<EditorPalette | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

    const [slides, setSlides] = useState<EditorSlide[]>([{ id: crypto.randomUUID(), name: "Slide 1", elements: [] }]);
    const [activeSlideId, setActiveSlideId] = useState(slides[0].id);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const [zoom, setZoom] = useState(0.56);
    const [hasManualZoom, setHasManualZoom] = useState(false);
    const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
    const [liveElementPosition, setLiveElementPosition] = useState<{ id: string; x: number; y: number } | null>(null);
    const [isAdvancedPaletteOpen, setIsAdvancedPaletteOpen] = useState(false);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [isExportingAllSlides, setIsExportingAllSlides] = useState(false);
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
        setServerCarousel(nextCarousel);
        const editorSlides = firestoreSlidesToEditorSlides(nextCarousel.slides as any[]);
        const fallbackSlideId = editorSlides[0]?.id ?? crypto.randomUUID();

        setSlides(editorSlides);
        setActiveSlideId((prev) => {
            const exists = editorSlides.some((s) => s.id === prev);
            return exists ? prev : fallbackSlideId;
        });
        setSelectedElementId((prev) => {
            if (!prev) {
                return null;
            }

            const nextActiveSlideId = editorSlides.some((s) => s.id === activeSlideId)
                ? activeSlideId
                : fallbackSlideId;
            const nextActiveSlide = editorSlides.find((slide) => slide.id === nextActiveSlideId) ?? editorSlides[0];
            const stillExists = nextActiveSlide?.elements.some((element) => element.id === prev);

            return stillExists ? prev : null;
        });
        setLiveElementPosition(null);
    }

    const activeInspectorElements = useMemo(
        () => getInspectorElements(serverCarousel, activeSlideIndex),
        [serverCarousel, activeSlideIndex]
    );
    const selectedEditableElement = useMemo(
        () => activeSlide?.elements.find((element) => element.id === selectedElementId) ?? null,
        [activeSlide, selectedElementId]
    );
    const selectedElementPosition = useMemo(() => {
        if (!selectedEditableElement) {
            return null;
        }

        if (liveElementPosition?.id === selectedEditableElement.id) {
            return { x: liveElementPosition.x, y: liveElementPosition.y };
        }

        return {
            x: Number(selectedEditableElement.x ?? 0),
            y: Number(selectedEditableElement.y ?? 0),
        };
    }, [selectedEditableElement, liveElementPosition]);
    const activePalette = useMemo(
        () => getResolvedPalette(serverCarousel?.meta?.palette),
        [serverCarousel]
    );
    const activeTemplateId = useMemo(() => {
        const rawTemplateId = String(serverCarousel?.meta?.style ?? "").trim();
        return findTemplateById(rawTemplateId)?.id ?? "microBlogBold";
    }, [serverCarousel]);
    const palettePresets = useMemo(
        () => TEMPLATE_PALETTE_PRESETS[activeTemplateId] ?? TEMPLATE_PALETTE_PRESETS.microBlogBold,
        [activeTemplateId]
    );
    const renderedCarousel = useMemo(
        () => applyProfileCardIdentity(serverCarousel, {
            displayName: userData?.displayName ?? user?.displayName ?? "",
            specialization: userData?.specialization ?? "",
            avatarUrl: userData?.avatarUrl ?? user?.photoURL ?? "",
        }),
        [serverCarousel, userData, user]
    );
    const activePalettePresetId = useMemo(
        () => {
            if (originalPalette && palettesEqual(originalPalette, activePalette)) {
                return "original";
            }

            return palettePresets.find((preset) => palettesEqual(preset.palette, activePalette))?.id ?? null;
        },
        [activePalette, originalPalette, palettePresets]
    );
    const editableSelectedElement = useMemo(
        () => (
            selectedEditableElement && isEditableElementType(selectedEditableElement.type)
                ? selectedEditableElement
                : null
        ),
        [selectedEditableElement]
    );
    const isInspectorEditingElement = Boolean(editableSelectedElement);
    const selectedElementKindLabel = editableSelectedElement?.type === "text" ? "Texto" : "Imagem";

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
                setServerCarousel(null);
                setIsLoadingProject(false);
                setErrorMessage("Esse projeto não existe mais.");
                return;
            }

            try {
                const data = snap.data();
                setProjectName(data?.meta?.title ?? "Projeto sem nome");

                const raw = projectDocToCarousel(data);
                setOriginalPalette(extractOriginalPalette(data, raw));
                updateSlidesFromCarousel(raw);
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
        if (!user) {
            setUserData(null);
            return;
        }

        const unsub = onSnapshot(
            doc(db, "users", user.uid),
            (snap) => {
                if (snap.exists()) {
                    setUserData(snap.data() as UserData);
                }
            },
            (err) => {
                console.error("Erro ao carregar dados do usuário:", err);
            }
        );

        return () => unsub();
    }, [user]);

    useEffect(() => {
        return () => {
            if (persistTimeoutRef.current !== null) {
                window.clearTimeout(persistTimeoutRef.current);
            }
        };
    }, []);

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

    useEffect(() => {
        const container = stageContainerRef.current;
        if (!container) {
            return;
        }

        function applyResponsiveZoom() {
            if (hasManualZoom) {
                return;
            }

            const nextZoom = computeResponsiveZoom(container as any);
            setZoom((current) => (
                Math.abs(current - nextZoom) < 0.01 ? current : nextZoom
            ));
        }

        applyResponsiveZoom();

        const observer = new ResizeObserver(() => {
            applyResponsiveZoom();
        });

        observer.observe(container);
        window.addEventListener("resize", applyResponsiveZoom);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", applyResponsiveZoom);
        };
    }, [hasManualZoom]);

    useEffect(() => {
        if (selectedElementId) {
            setMobilePanel("inspector");
        }
    }, [selectedElementId]);

    function zoomIn() {
        setHasManualZoom(true);
        setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
    }

    function zoomOut() {
        setHasManualZoom(true);
        setZoom((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
    }

    function resetZoom() {
        setHasManualZoom(false);
        if (stageContainerRef.current) {
            setZoom(computeResponsiveZoom(stageContainerRef.current));
            return;
        }
        setZoom(0.56);
    }

    function goToSlide(index: number) {
        const next = slides[index];
        if (!next) {
            return;
        }

        setActiveSlideId(next.id);
        setSelectedElementId(null);
        setLiveElementPosition(null);
    }

    function handleStageTouchStart(event: TouchEvent<HTMLDivElement>) {
        if (event.touches.length === 2) {
            pinchStartRef.current = {
                distance: getTouchDistance(event.touches[0], event.touches[1]),
                zoom,
            };
            swipeStartRef.current = null;
            return;
        }

        pinchStartRef.current = null;

        const touch = event.touches[0];
        if (!touch || event.touches.length !== 1) {
            swipeStartRef.current = null;
            return;
        }

        swipeStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }

    function handleStageTouchMove(event: TouchEvent<HTMLDivElement>) {
        if (event.touches.length !== 2 || !pinchStartRef.current) {
            return;
        }

        const distance = getTouchDistance(event.touches[0], event.touches[1]);
        const scaleFactor = distance / pinchStartRef.current.distance;
        const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, Number((pinchStartRef.current.zoom * scaleFactor).toFixed(2)))
        );

        setHasManualZoom(true);
        setZoom((current) => (Math.abs(current - nextZoom) < 0.01 ? current : nextZoom));
    }

    function handleStageTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
        if (event.touches.length < 2) {
            pinchStartRef.current = null;
        }

        const start = swipeStartRef.current;
        swipeStartRef.current = null;

        if (!start || event.changedTouches.length !== 1 || selectedElementId) {
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const elapsed = Date.now() - start.time;

        const isHorizontalSwipe = Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3;
        const isFastEnough = elapsed < 700;

        if (!isHorizontalSwipe || !isFastEnough) {
            return;
        }

        if (deltaX < 0) {
            goToSlide(activeSlideIndex + 1);
            return;
        }

        goToSlide(activeSlideIndex - 1);
    }

    function exportActiveSlide() {
        void exportSingleSlide();
    }

    async function exportSingleSlide() {
        if (!serverCarousel || isExportingAllSlides) {
            return;
        }

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                throw new Error("Usuário não autenticado.");
            }

            setErrorMessage(null);
            setStatusMessage(`Exportando slide ${activeSlideIndex + 1}...`);

            const response = await fetch(EXPORT_ZIP_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projectId, slideIndex: activeSlideIndex }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const fileName = slugifyFileName(projectName || "carrossel") || "carrossel";
            downloadBlob(blob, `${fileName}-slide-${String(activeSlideIndex + 1).padStart(2, "0")}.png`);
            setStatusMessage(`Slide ${activeSlideIndex + 1} exportado.`);
        } catch (error) {
            console.error(error);
            setErrorMessage("Não foi possível exportar o slide.");
        }
    }

    async function exportAllSlides() {
        if (!serverCarousel || serverCarousel.slides.length === 0 || isExportingAllSlides) {
            return;
        }

        setIsExportingAllSlides(true);
        setErrorMessage(null);
        setStatusMessage("Preparando ZIP...");

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                throw new Error("Usuário não autenticado.");
            }

            const response = await fetch(EXPORT_ZIP_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projectId }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const fileName = slugifyFileName(projectName || "carrossel") || "carrossel";
            downloadBlob(blob, `${fileName}.zip`);
            setStatusMessage("ZIP com todos os slides baixado.");
        } catch (error) {
            console.error(error);
            setErrorMessage("Não foi possível exportar todos os slides.");
        } finally {
            setIsExportingAllSlides(false);
        }
    }

    function updateEditableElement(
        elementId: string,
        patch: Partial<EditorElement>,
        options?: { persistDelayMs?: number | null }
    ) {
        setSlides((prev) =>
            prev.map((slide) =>
                slide.id === activeSlideId
                    ? {
                        ...slide,
                        elements: slide.elements.map((element) =>
                            element.id === elementId ? { ...element, ...patch } : element
                        ),
                    }
                    : slide
            )
        );

        setLiveElementPosition(null);
        setServerCarousel((current) => {
            const nextCarousel = updateCarouselElement(current, activeSlideId, elementId, patch);
            if (nextCarousel && options?.persistDelayMs !== null && options?.persistDelayMs !== undefined) {
                scheduleCarouselPersist(nextCarousel, options.persistDelayMs);
            }
            return nextCarousel;
        });
    }

    async function persistCarousel(nextCarousel: Carousel) {
        if (!projectId) {
            return;
        }

        await updateDoc(doc(db, "projects", projectId), {
            renderCarousel: nextCarousel,
            slides: nextCarousel.slides,
            updatedAt: serverTimestamp(),
        });
    }

    function scheduleCarouselPersist(nextCarousel: Carousel, delayMs: number) {
        if (persistTimeoutRef.current !== null) {
            window.clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = window.setTimeout(() => {
            void persistCarousel(nextCarousel).catch((error) => {
                console.error(error);
                setErrorMessage("Não foi possível salvar alterações.");
            });
            persistTimeoutRef.current = null;
        }, delayMs);
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

    async function generateSelectedImage() {
        if (
            !projectId
            || !selectedEditableElement
            || (selectedEditableElement.type !== "image" && selectedEditableElement.type !== "backgroundImage")
        ) {
            return;
        }

        if (typeof selectedEditableElement.prompt !== "string" || selectedEditableElement.prompt.trim().length === 0) {
            setErrorMessage("Esse elemento não tem prompt de imagem.");
            return;
        }

        setIsGeneratingImages(true);
        setStatusMessage("Gerando imagem com IA...");
        setErrorMessage(null);

        updateEditableElement(selectedEditableElement.id, { status: "pending" });

        try {
            const src = await requestImageGeneration(projectId, activeSlideId, selectedEditableElement.id);
            updateEditableElement(selectedEditableElement.id, { src, status: "ready" });
            setStatusMessage("Imagem atualizada.");
        } catch (error) {
            console.error(error);
            updateEditableElement(selectedEditableElement.id, { status: "error" });
            setErrorMessage("Não foi possível gerar a imagem.");
        } finally {
            setIsGeneratingImages(false);
        }
    }

    function openImagePicker() {
        imagePickerRef.current?.click();
    }

    async function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (
            !file
            || !projectId
            || !selectedEditableElement
            || (selectedEditableElement.type !== "image" && selectedEditableElement.type !== "backgroundImage")
        ) {
            return;
        }

        try {
            const extension = getFileExtension(file);
            const path = `projects/${projectId}/slides/${activeSlideId}/${selectedEditableElement.id}.${extension}`;
            const fileRef = storageRef(storage, path);

            setErrorMessage(null);
            setStatusMessage("Enviando imagem...");

            await uploadBytes(fileRef, file, { contentType: file.type || "image/png" });
            const src = await getDownloadURL(fileRef);

            const nextCarousel = updateCarouselElement(
                serverCarousel,
                activeSlideId,
                selectedEditableElement.id,
                { src, status: "ready" }
            );

            updateEditableElement(selectedEditableElement.id, { src, status: "ready" });

            if (nextCarousel) {
                await persistCarousel(nextCarousel);
            }

            setStatusMessage("Imagem salva na galeria.");
        } catch (error) {
            console.error(error);
            setErrorMessage("Não foi possível enviar a imagem.");
        } finally {
            event.target.value = "";
        }
    }

    async function removeSelectedImage() {
        if (
            !selectedEditableElement
            || (selectedEditableElement.type !== "image" && selectedEditableElement.type !== "backgroundImage")
        ) {
            return;
        }

        const nextCarousel = updateCarouselElement(
            serverCarousel,
            activeSlideId,
            selectedEditableElement.id,
            { src: "", status: "idle" }
        );

        updateEditableElement(selectedEditableElement.id, { src: "", status: "idle" });

        if (nextCarousel) {
            await persistCarousel(nextCarousel);
        }

        setStatusMessage("Imagem removida. Você pode gerar outra ou escolher da galeria.");
        setErrorMessage(null);
    }

    function handleElementPositionChange(elementId: string, position: { x: number; y: number }) {
        setLiveElementPosition(null);
        updateEditableElement(elementId, position, { persistDelayMs: 0 });
    }

    function handleElementLivePositionChange(elementId: string, position: { x: number; y: number }) {
        setLiveElementPosition({
            id: elementId,
            x: position.x,
            y: position.y,
        });
    }

    function handleTextContentChange(value: string) {
        if (!selectedEditableElement || selectedEditableElement.type !== "text") {
            return;
        }

        updateEditableElement(selectedEditableElement.id, { content: value }, { persistDelayMs: 500 });
    }

    function handleElementCoordinateChange(axis: "x" | "y", rawValue: string) {
        if (!selectedEditableElement || !isEditableElementType(selectedEditableElement.type)) {
            return;
        }

        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
            return;
        }

        updateEditableElement(selectedEditableElement.id, { [axis]: parsed }, { persistDelayMs: 300 });
    }

    function handlePaletteChange(key: PaletteKey, value: string) {
        setServerCarousel((current) => {
            if (!current) {
                return current;
            }

            const previousPalette = getResolvedPalette(current.meta.palette);
            const nextPalette = {
                ...previousPalette,
                [key]: value,
            };

            const nextCarousel = recolorCarouselPalette(current, previousPalette, nextPalette);
            scheduleCarouselPersist(nextCarousel, 300);
            return nextCarousel;
        });
    }

    function applyPalettePreset(palette: EditorPalette) {
        setIsAdvancedPaletteOpen(false);
        setServerCarousel((current) => {
            if (!current) {
                return current;
            }

            const previousPalette = getResolvedPalette(current.meta.palette);
            const nextCarousel = recolorCarouselPalette(current, previousPalette, palette);
            scheduleCarouselPersist(nextCarousel, 300);
            return nextCarousel;
        });
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
                    <button
                        className="secondary_button"
                        type="button"
                        onClick={exportAllSlides}
                        disabled={isExportingAllSlides || !serverCarousel}
                    >
                        {isExportingAllSlides ? "Baixando..." : "Baixar todos"}
                    </button>
                    <button className="primary_button" type="button" onClick={exportActiveSlide}>
                        Exportar PNG
                    </button>
                </div>
            </header>

            <div className="editor_workspace">
                <aside className={`panel panel_left ${mobilePanel === "slides" ? "is_mobile_open" : ""}`}>
                    <div className="panel_title_row">
                        <h3>Páginas</h3>
                        <span>{slides.length}</span>
                    </div>

                    <div className="slides_list">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                className={`slide_item ${slide.id === activeSlideId ? "active" : ""}`}
                                onClick={() => {
                                    goToSlide(index);
                                    setMobilePanel(null);
                                }}
                                type="button"
                            >
                                <span className="slide_index">{index + 1}</span>
                                <span className="slide_text">{getSlideListLabel(slide, index)}</span>
                            </button>
                        ))}
                    </div>

                </aside>

                <main className="stage_section">

                    <div>
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
                        <div className="mobile_swipe_hint">Deslize com um dedo para trocar de slide. Use dois dedos para zoom.</div>
                    </div>
                    <div
                        className="stage_container"
                        ref={stageContainerRef}
                        onTouchStart={handleStageTouchStart}
                        onTouchMove={handleStageTouchMove}
                        onTouchEnd={handleStageTouchEnd}
                    >
                        <Canvas
                            ref={canvasRef}
                            carousel={renderedCarousel}
                            slideIndex={activeSlideIndex}
                            zoom={zoom}
                            selectedElementId={selectedElementId}
                            onSelectElement={(elementId) => {
                                setSelectedElementId(elementId);
                                setLiveElementPosition(null);
                            }}
                            onElementLivePositionChange={handleElementLivePositionChange}
                            onElementPositionChange={handleElementPositionChange}
                            onExportPNG={() => {
                                setStatusMessage(`Slide ${activeSlideIndex + 1} exportado em PNG.`);
                            }}
                        />
                    </div>
                </main>

                <aside className={`panel panel_right ${mobilePanel === "inspector" ? "is_mobile_open" : ""}`}>
                    {editableSelectedElement ? (
                        <div className="inspector_card">
                            <label>Ajustes</label>
                            <div className="editor_fields">
                                {/* <div className="inspector_mobile_summary">
                                    <span className="inspector_mobile_kind">{selectedElementKindLabel}</span>
                                    <strong>{getInspectorElementPreview(
                                        activeInspectorElements.find((element) => element.id === editableSelectedElement.id)
                                        ?? {
                                            id: editableSelectedElement.id,
                                            type: editableSelectedElement.type,
                                            name: selectedElementKindLabel,
                                            layer: "content",
                                        },
                                        activeSlide
                                    )}</strong>
                                    <p>Toque no canvas para selecionar outro elemento ou ajuste por aqui.</p>
                                </div> */}

                                {editableSelectedElement.type === "text" && (
                                    <>
                                        <span className="field_caption">Texto</span>
                                        <textarea
                                            className="editor_textarea"
                                            value={String(editableSelectedElement.content ?? "")}
                                            onChange={(event) => handleTextContentChange(event.target.value)}
                                        />
                                    </>
                                )}

                                {(editableSelectedElement.type === "image"
                                    || editableSelectedElement.type === "backgroundImage") && (
                                        <div className="image_actions_block">
                                            <span className="field_caption">Imagem</span>
                                            <div className="image_actions_row">
                                                <button
                                                    type="button"
                                                    className="secondary_button image_action_button"
                                                    onClick={generateSelectedImage}
                                                    disabled={isGeneratingImages}
                                                >
                                                    <span className="image_action_icon" aria-hidden="true">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="m18 9.064a3.049 3.049 0 0 0 -.9-2.164 3.139 3.139 0 0 0 -4.334 0l-11.866 11.869a3.064 3.064 0 0 0 4.33 4.331l11.87-11.869a3.047 3.047 0 0 0 .9-2.167zm-14.184 12.624a1.087 1.087 0 0 1 -1.5 0 1.062 1.062 0 0 1 0-1.5l7.769-7.77 1.505 1.505zm11.872-11.872-2.688 2.689-1.5-1.505 2.689-2.688a1.063 1.063 0 1 1 1.5 1.5zm-10.825-6.961 1.55-.442.442-1.55a1.191 1.191 0 0 1 2.29 0l.442 1.55 1.55.442a1.191 1.191 0 0 1 0 2.29l-1.55.442-.442 1.55a1.191 1.191 0 0 1 -2.29 0l-.442-1.55-1.55-.442a1.191 1.191 0 0 1 0-2.29zm18.274 14.29-1.55.442-.442 1.55a1.191 1.191 0 0 1 -2.29 0l-.442-1.55-1.55-.442a1.191 1.191 0 0 1 0-2.29l1.55-.442.442-1.55a1.191 1.191 0 0 1 2.29 0l.442 1.55 1.55.442a1.191 1.191 0 0 1 0 2.29zm-5.382-14.645 1.356-.387.389-1.358a1.042 1.042 0 0 1 2 0l.387 1.356 1.356.387a1.042 1.042 0 0 1 0 2l-1.356.387-.387 1.359a1.042 1.042 0 0 1 -2 0l-.387-1.355-1.358-.389a1.042 1.042 0 0 1 0-2z" />
                                                        </svg>
                                                    </span>
                                                    <span>{isGeneratingImages ? "Gerando..." : "Gerar com IA"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary_button image_action_button"
                                                    onClick={openImagePicker}
                                                >
                                                    <span className="image_action_icon" aria-hidden="true">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19,3H12.472a1.019,1.019,0,0,1-.447-.1L8.869,1.316A3.014,3.014,0,0,0,7.528,1H5A5.006,5.006,0,0,0,0,6V18a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V8A5.006,5.006,0,0,0,19,3ZM5,3H7.528a1.019,1.019,0,0,1,.447.1l3.156,1.579A3.014,3.014,0,0,0,12.472,5H19a3,3,0,0,1,2.779,1.882L2,6.994V6A3,3,0,0,1,5,3ZM19,21H5a3,3,0,0,1-3-3V8.994l20-.113V18A3,3,0,0,1,19,21Z" />
                                                        </svg>
                                                    </span>
                                                    <span>Galeria</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary_button image_action_button"
                                                    onClick={() => void removeSelectedImage()}
                                                    disabled={!editableSelectedElement.src}
                                                >
                                                    <span className="image_action_icon" aria-hidden="true">
                                                        <svg viewBox="0 0 24 24" fill="#d92d20">
                                                            <path d="M21,4H17.9A5.009,5.009,0,0,0,13,0H11A5.009,5.009,0,0,0,6.1,4H3A1,1,0,0,0,3,6H4V19a5.006,5.006,0,0,0,5,5h6a5.006,5.006,0,0,0,5-5V6h1a1,1,0,0,0,0-2ZM11,2h2a3.006,3.006,0,0,1,2.829,2H8.171A3.006,3.006,0,0,1,11,2Zm7,17a3,3,0,0,1-3,3H9a3,3,0,0,1-3-3V6H18Z" />
                                                            <path d="M10,18a1,1,0,0,0,1-1V11a1,1,0,0,0-2,0v6A1,1,0,0,0,10,18Z" />
                                                            <path d="M14,18a1,1,0,0,0,1-1V11a1,1,0,0,0-2,0v6A1,1,0,0,0,14,18Z" />
                                                        </svg>
                                                    </span>
                                                    <span className="del_icn">Remover</span>
                                                </button>
                                            </div>
                                            {typeof editableSelectedElement.prompt === "string"
                                                && editableSelectedElement.prompt.trim().length > 0 ? (
                                                <p className="image_prompt_hint">{editableSelectedElement.prompt}</p>
                                            ) : null}
                                        </div>
                                    )}

                                <div className="editor_grid editor_grid_coordinates">
                                    <label className="editor_field">
                                        <span>X</span>
                                        <input
                                            type="number"
                                            value={Math.round(Number(selectedElementPosition?.x ?? 0))}
                                            onChange={(event) => handleElementCoordinateChange("x", event.target.value)}
                                        />
                                    </label>

                                    <label className="editor_field">
                                        <span>Y</span>
                                        <input
                                            type="number"
                                            value={Math.round(Number(selectedElementPosition?.y ?? 0))}
                                            onChange={(event) => handleElementCoordinateChange("y", event.target.value)}
                                        />
                                    </label>
                                </div>
                                <p className="mobile_coordinates_hint">Posição fina disponível no desktop.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="inspector_card">
                            <label>Paleta global</label>
                            <div className="editor_fields">
                                <div className="palette_preset_grid">
                                    <button
                                        type="button"
                                        className={`palette_preset_card ${activePalettePresetId === "original" ? "is_active" : ""}`}
                                        onClick={() => applyPalettePreset(originalPalette ?? activePalette)}
                                    >
                                        <span className="palette_preset_title">Original</span>
                                        <span className="palette_preset_description">Como veio do template</span>
                                        <span className="palette_preset_swatches">
                                            {renderPaletteSwatches(originalPalette ?? activePalette)}
                                        </span>
                                    </button>

                                    {palettePresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            className={`palette_preset_card ${activePalettePresetId === preset.id ? "is_active" : ""}`}
                                            onClick={() => applyPalettePreset(preset.palette)}
                                        >
                                            <span className="palette_preset_title">{preset.label}</span>
                                            <span className="palette_preset_description">{preset.description}</span>
                                            <span className="palette_preset_swatches">
                                                {renderPaletteSwatches(preset.palette)}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="advanced_palette_toggle"
                                    onClick={() => setIsAdvancedPaletteOpen((current) => !current)}
                                >
                                    {isAdvancedPaletteOpen ? "Fechar personalização" : "Personalizar cores"}
                                </button>

                                {isAdvancedPaletteOpen ? (
                                    <div className="palette_grid">
                                        <label className="editor_field">
                                            <span>Background</span>
                                            <div className="palette_input_row">
                                                <input
                                                    className="palette_swatch"
                                                    type="color"
                                                    value={activePalette.bg}
                                                    onChange={(event) => handlePaletteChange("bg", event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    value={activePalette.bg}
                                                    onChange={(event) => handlePaletteChange("bg", event.target.value)}
                                                />
                                            </div>
                                        </label>

                                        <label className="editor_field">
                                            <span>Text</span>
                                            <div className="palette_input_row">
                                                <input
                                                    className="palette_swatch"
                                                    type="color"
                                                    value={activePalette.text}
                                                    onChange={(event) => handlePaletteChange("text", event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    value={activePalette.text}
                                                    onChange={(event) => handlePaletteChange("text", event.target.value)}
                                                />
                                            </div>
                                        </label>

                                        <label className="editor_field">
                                            <span>Muted</span>
                                            <div className="palette_input_row">
                                                <input
                                                    className="palette_swatch"
                                                    type="color"
                                                    value={activePalette.muted}
                                                    onChange={(event) => handlePaletteChange("muted", event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    value={activePalette.muted}
                                                    onChange={(event) => handlePaletteChange("muted", event.target.value)}
                                                />
                                            </div>
                                        </label>

                                        <label className="editor_field">
                                            <span>Accent</span>
                                            <div className="palette_input_row">
                                                <input
                                                    className="palette_swatch"
                                                    type="color"
                                                    value={activePalette.accent}
                                                    onChange={(event) => handlePaletteChange("accent", event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    value={activePalette.accent}
                                                    onChange={(event) => handlePaletteChange("accent", event.target.value)}
                                                />
                                            </div>
                                        </label>

                                        <label className="editor_field">
                                            <span>Accent 2</span>
                                            <div className="palette_input_row">
                                                <input
                                                    className="palette_swatch"
                                                    type="color"
                                                    value={activePalette.accent2}
                                                    onChange={(event) => handlePaletteChange("accent2", event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    value={activePalette.accent2}
                                                    onChange={(event) => handlePaletteChange("accent2", event.target.value)}
                                                />
                                            </div>
                                        </label>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <div className="elements_list">
                        {activeInspectorElements.slice(0, 10).map((element) => (
                            <button
                                className={`element_row ${selectedElementId === element.id ? "active" : ""}`}
                                key={element.id}
                                onClick={() => {
                                    setSelectedElementId(element.id);
                                    setLiveElementPosition(null);
                                }}
                                type="button"
                            >
                                <span className="element_row_icon" aria-hidden="true">
                                    {renderInspectorElementIcon(element.type)}
                                </span>
                                <span className="element_row_label">{getInspectorElementPreview(element, activeSlide)}</span>
                            </button>
                        ))}
                        {activeInspectorElements.length > 10 && (
                            <div className="elements_more">+ {activeInspectorElements.length - 10} elementos</div>
                        )}
                    </div>
                </aside>
            </div>
            <div
                className={`mobile_panel_backdrop ${mobilePanel ? "is_visible" : ""}`}
                onClick={() => setMobilePanel(null)}
                aria-hidden={!mobilePanel}
            />
            <div className="mobile_editor_dock">
                <button
                    type="button"
                    className={`mobile_dock_button ${mobilePanel === "slides" ? "is_active" : ""}`}
                    onClick={() => setMobilePanel((current) => current === "slides" ? null : "slides")}
                >
                    <span className="mobile_dock_label">Slides</span>
                    <span className="mobile_dock_value">{slides.length}</span>
                </button>
                <button
                    type="button"
                    className={`mobile_dock_button ${mobilePanel === "inspector" ? "is_active" : ""}`}
                    onClick={() => setMobilePanel((current) => current === "inspector" ? null : "inspector")}
                >
                    <span className="mobile_dock_label">{isInspectorEditingElement ? "Ajustes" : "Paleta"}</span>
                    <span className="mobile_dock_value">
                        {selectedElementId ? "Elemento" : "Global"}
                    </span>
                </button>
                <button
                    type="button"
                    className="mobile_dock_button is_primary"
                    onClick={exportActiveSlide}
                >
                    <span className="mobile_dock_label">Exportar</span>
                    <span className="mobile_dock_value">PNG</span>
                </button>
            </div>
            <input
                ref={imagePickerRef}
                type="file"
                accept="image/*"
                className="hidden_file_input"
                onChange={handleImageFileChange}
            />
        </div>
    );
}

function projectDocToCarousel(data: any): Carousel {
    // Fonte de verdade do editor: payload final de render persistido no backend.
    if (data?.renderCarousel?.meta && Array.isArray(data?.renderCarousel?.slides)) {
        const fromRender = data.renderCarousel as Carousel;
        logCarouselSignature("renderCarousel", fromRender);
        return fromRender;
    }

    // Compat legado: slides persistidos direto no projeto.
    if (Array.isArray(data?.slides) && data.slides.length > 0) {
        const fromSlides = {
            meta: data.meta,
            slides: data.slides,
        } as Carousel;
        logCarouselSignature("slides", fromSlides);
        return fromSlides;
    }

    // Fallback para docs legados que só tinham ai.normalized.
    if (data?.ai?.normalized?.meta && data?.ai?.normalized?.slides) {
        const fromNormalized = data.ai.normalized as Carousel;
        logCarouselSignature("ai.normalized", fromNormalized);
        return fromNormalized;
    }

    if (data?.ai?.raw?.meta && data?.ai?.raw?.slides) {
        const fromRaw = data.ai.raw as Carousel;
        logCarouselSignature("ai.raw", fromRaw);
        return fromRaw;
    }

    const fallback = {
        meta: data?.meta ?? {},
        slides: data?.slides ?? [],
    } as Carousel;
    logCarouselSignature("fallback", fallback);
    return fallback;
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

function logCarouselSignature(source: string, carousel: Carousel) {
    if (!import.meta.env.DEV) {
        return;
    }

    const firstSlide = carousel?.slides?.[0] as any;
    const elements = Array.isArray(firstSlide?.elements)
        ? firstSlide.elements
        : [
            ...(Array.isArray(firstSlide?.layers?.background) ? firstSlide.layers.background : []),
            ...(Array.isArray(firstSlide?.layers?.atmosphere) ? firstSlide.layers.atmosphere : []),
            ...(Array.isArray(firstSlide?.layers?.content) ? firstSlide.layers.content : []),
            ...(Array.isArray(firstSlide?.layers?.ui) ? firstSlide.layers.ui : []),
        ];

    const sample = elements.slice(0, 12).map((el: any) => ({
        id: el?.id,
        type: el?.type,
        name: el?.name,
    }));

    console.info("[EditPage] carousel source", {
        source,
        style: carousel?.meta?.style ?? null,
        slideCount: carousel?.slides?.length ?? 0,
        firstSlideSample: sample,
    });
}

function getInspectorElements(carousel: Carousel | null, slideIndex: number): InspectorElementEntry[] {
    const slide = carousel?.slides?.[slideIndex] as any;
    if (!slide) {
        return [];
    }

    if (slide?.layers) {
        return [
            ...mapInspectorLayer(slide.layers.background, "background"),
            ...mapInspectorLayer(slide.layers.atmosphere, "atmosphere"),
            ...mapInspectorLayer(slide.layers.content, "content"),
            ...mapInspectorLayer(slide.layers.ui, "ui"),
        ].filter((element) => isEditableElementType(element.type));
    }

    if (Array.isArray(slide?.elements)) {
        return mapInspectorLayer(slide.elements, "flat").filter((element) => isEditableElementType(element.type));
    }

    if (Array.isArray(slide?.canvas?.elements)) {
        return mapInspectorLayer(slide.canvas.elements, "flat").filter((element) => isEditableElementType(element.type));
    }

    return [];
}

function mapInspectorLayer(
    elements: any[] | undefined,
    layer: InspectorElementEntry["layer"]
): InspectorElementEntry[] {
    if (!Array.isArray(elements)) {
        return [];
    }

    return elements
        .filter((element) => element?.id && element?.type)
        .map((element) => ({
            id: String(element.id),
            type: String(element.type),
            name: typeof element.name === "string" ? element.name : undefined,
            layer,
        }));
}


function updateCarouselElement(
    carousel: Carousel | null,
    slideId: string,
    elementId: string,
    patch: Partial<EditorElement>
): Carousel | null {
    if (!carousel) {
        return carousel;
    }

    return {
        ...carousel,
        slides: carousel.slides.map((slide: any) => {
            if (slide?.id !== slideId) {
                return slide;
            }

            if (slide?.layers) {
                return {
                    ...slide,
                    layers: {
                        background: updateElementList(slide.layers.background, elementId, patch),
                        atmosphere: updateElementList(slide.layers.atmosphere, elementId, patch),
                        content: updateElementList(slide.layers.content, elementId, patch),
                        ui: updateElementList(slide.layers.ui, elementId, patch),
                    },
                };
            }

            if (Array.isArray(slide?.elements)) {
                return {
                    ...slide,
                    elements: updateElementList(slide.elements, elementId, patch),
                };
            }

            return slide;
        }),
    };
}

function updateElementList(elements: any[] | undefined, elementId: string, patch: Partial<EditorElement>) {
    if (!Array.isArray(elements)) {
        return elements;
    }

    return elements.map((element) => {
        if (element?.id !== elementId) {
            return element;
        }

        const next = { ...element };
        if (patch.x !== undefined) next.x = patch.x;
        if (patch.y !== undefined) next.y = patch.y;
        if (patch.src !== undefined) {
            next.src = patch.src;
            next.url = patch.src;
        }
        if (patch.status !== undefined) next.status = patch.status;
        if (patch.content !== undefined && element.type === "text") {
            next.text = patch.content;
            next.content = patch.content;
        }
        return next;
    });
}

function isEditableElementType(type: string): type is EditableElementType {
    return type === "text" || type === "image" || type === "backgroundImage";
}

function humanizeElementType(type: string, name?: string) {
    if (type === "text") return "Texto";
    if (type === "image") return "Imagem";
    if (type === "backgroundImage") return "Imagem de fundo";
    if (type === "profileCard") return "Card de perfil";
    if (type === "background") return "Fundo";
    if (type === "gradientRect") return "Gradiente";
    if (type === "glow") return "Brilho";
    if (type === "path") return "Forma";
    if (type === "shape" && name === "arrows") return "Setas";
    if (type === "shape") return "Forma";
    return type;
}

function getSlideListLabel(slide: EditorSlide, index: number) {
    const ignoredLabels = new Set([
        "abertura",
        "virada",
        "design",
        "imagem",
    ]);

    const textCandidates = slide.elements
        .filter((element) => element.type === "text")
        .map((element) => {
            const raw = String(element.content ?? "").trim();
            const normalized = raw.toLowerCase();
            const fontSize = Number(element.fontSize ?? 0);

            return {
                raw,
                normalized,
                fontSize,
            };
        })
        .filter((candidate) => {
            if (!candidate.raw) {
                return false;
            }

            if (candidate.raw.length < 4) {
                return false;
            }

            if (ignoredLabels.has(candidate.normalized)) {
                return false;
            }

            if (candidate.normalized.includes("designer")) {
                return false;
            }

            if (candidate.normalized.includes("design com propósito")) {
                return false;
            }

            return true;
        })
        .sort((a, b) => b.fontSize - a.fontSize);

    const best = textCandidates[0]?.raw;
    if (!best) {
        return `Slide ${index + 1}`;
    }

    return truncateLabel(best, 30);
}

function truncateLabel(value: string, maxLength: number) {
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function renderInspectorElementIcon(type: string) {
    if (type === "image" || type === "backgroundImage") {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                <circle cx="16.5" cy="8" r="1.7" />
                <path d="M5.5 16l4.2-4.2a1 1 0 0 1 1.4 0L14 14.5a1 1 0 0 0 1.4 0l1.1-1.1a1 1 0 0 1 1.4 0l2 2" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3.5" width="16" height="17" rx="4" />
            <path d="M9 8h6" />
            <path d="M12 8v8" />
        </svg>
    );
}

function computeResponsiveZoom(container: HTMLElement) {
    const widthRatio = Math.max(0.1, (container.clientWidth - STAGE_PADDING) / DOC_W);
    const heightRatio = Math.max(0.1, (container.clientHeight - STAGE_PADDING) / DOC_H);
    const fitted = Math.min(widthRatio, heightRatio);
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(fitted.toFixed(2))));
}

function getInspectorElementPreview(element: InspectorElementEntry, slide?: EditorSlide) {
    const fullElement = slide?.elements.find((item) => item.id === element.id);
    if (fullElement?.type === "text") {
        return String(fullElement.content ?? "").trim() || "Texto vazio";
    }

    return humanizeElementType(element.type, element.name);
}

function getResolvedPalette(palette?: Carousel["meta"]["palette"]): EditorPalette {
    return {
        bg: String(palette?.bg ?? "#ffffff"),
        text: String(palette?.text ?? "#111111"),
        muted: String(palette?.muted ?? "#777777"),
        accent: String(palette?.accent ?? "#2563eb"),
        accent2: String(palette?.accent2 ?? "#a855f7"),
    };
}

function extractOriginalPalette(data: any, fallbackCarousel: Carousel): EditorPalette {
    if (data?.ai?.normalized?.meta?.palette) {
        return getResolvedPalette(data.ai.normalized.meta.palette);
    }

    if (data?.ai?.content?.meta?.palette) {
        return getResolvedPalette(data.ai.content.meta.palette);
    }

    return getResolvedPalette(fallbackCarousel.meta.palette);
}

function palettesEqual(left: EditorPalette, right: EditorPalette) {
    return left.bg.toLowerCase() === right.bg.toLowerCase()
        && left.text.toLowerCase() === right.text.toLowerCase()
        && left.muted.toLowerCase() === right.muted.toLowerCase()
        && left.accent.toLowerCase() === right.accent.toLowerCase()
        && left.accent2.toLowerCase() === right.accent2.toLowerCase();
}

function renderPaletteSwatches(palette: EditorPalette) {
    return [
        palette.bg,
        palette.text,
        palette.muted,
        palette.accent,
        palette.accent2,
    ].map((color, index) => (
        <span
            key={`${color}-${index}`}
            className="palette_preset_swatch"
            style={{ background: color }}
        />
    ));
}

function recolorCarouselPalette(
    carousel: Carousel,
    previousPalette: EditorPalette,
    nextPalette: EditorPalette
): Carousel {
    return {
        ...carousel,
        meta: {
            ...carousel.meta,
            palette: nextPalette,
        },
        slides: carousel.slides.map((slide: any) => {
            if (slide?.layers) {
                return {
                    ...slide,
                    layers: {
                        background: recolorElementList(slide.layers.background, previousPalette, nextPalette),
                        atmosphere: recolorElementList(slide.layers.atmosphere, previousPalette, nextPalette),
                        content: recolorElementList(slide.layers.content, previousPalette, nextPalette),
                        ui: recolorElementList(slide.layers.ui, previousPalette, nextPalette),
                    },
                };
            }

            if (Array.isArray(slide?.elements)) {
                return {
                    ...slide,
                    elements: recolorElementList(slide.elements, previousPalette, nextPalette),
                };
            }

            return slide;
        }),
    };
}

function recolorElementList(
    elements: any[] | undefined,
    previousPalette: EditorPalette,
    nextPalette: EditorPalette
) {
    if (!Array.isArray(elements)) {
        return elements;
    }

    return elements.map((element) => recolorPaletteValue(element, previousPalette, nextPalette));
}

function recolorPaletteValue(value: unknown, previousPalette: EditorPalette, nextPalette: EditorPalette): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => recolorPaletteValue(item, previousPalette, nextPalette));
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const nextEntries = entries.map(([key, entryValue]) => {
        if (key === "prompt" && typeof entryValue === "string") {
            return [key, replacePaletteMentionsInPrompt(entryValue, previousPalette, nextPalette)];
        }

        if (key === "stops" && Array.isArray(entryValue)) {
            return [key, recolorGradientStops(entryValue, previousPalette, nextPalette)];
        }

        if (isPaletteColorProperty(key) && typeof entryValue === "string") {
            return [key, replacePaletteColor(entryValue, previousPalette, nextPalette)];
        }

        if (entryValue && typeof entryValue === "object") {
            return [key, recolorPaletteValue(entryValue, previousPalette, nextPalette)];
        }

        return [key, entryValue];
    });

    return Object.fromEntries(nextEntries);
}

function recolorGradientStops(
    stops: Array<number | string> | Array<[number, string]>,
    previousPalette: EditorPalette,
    nextPalette: EditorPalette
) {
    if (stops.every((stop) => Array.isArray(stop))) {
        return (stops as Array<[number, string]>).map(([offset, color]) => [
            offset,
            replacePaletteColor(color, previousPalette, nextPalette),
        ]);
    }

    return (stops as Array<number | string>).map((stop) => (
        typeof stop === "string"
            ? replacePaletteColor(stop, previousPalette, nextPalette)
            : stop
    ));
}

function isPaletteColorProperty(key: string) {
    return key === "fill"
        || key === "stroke"
        || key === "color"
        || key === "shadowColor"
        || key === "accent"
        || key === "text";
}

function replacePaletteMentionsInPrompt(
    prompt: string,
    previousPalette: EditorPalette,
    nextPalette: EditorPalette
) {
    let nextPrompt = prompt;

    for (const paletteKey of Object.keys(previousPalette) as PaletteKey[]) {
        const previousColor = previousPalette[paletteKey];
        const nextColor = nextPalette[paletteKey];
        if (!previousColor || !nextColor || previousColor === nextColor) {
            continue;
        }

        nextPrompt = nextPrompt.replaceAll(previousColor, nextColor);
        nextPrompt = nextPrompt.replaceAll(previousColor.toLowerCase(), nextColor.toLowerCase());
        nextPrompt = nextPrompt.replaceAll(previousColor.toUpperCase(), nextColor.toUpperCase());
    }

    return nextPrompt;
}

function replacePaletteColor(
    input: string,
    previousPalette: EditorPalette,
    nextPalette: EditorPalette
) {
    const inputColor = parseColorToken(input);
    if (!inputColor) {
        return input;
    }

    for (const paletteKey of Object.keys(previousPalette) as PaletteKey[]) {
        const previousColor = parseColorToken(previousPalette[paletteKey]);
        if (!previousColor) {
            continue;
        }

        if (!sameRgb(inputColor, previousColor)) {
            continue;
        }

        const nextColor = nextPalette[paletteKey];
        if (inputColor.alpha !== null && inputColor.alpha < 1) {
            return withPreservedAlpha(nextColor, inputColor.alpha);
        }

        return nextColor;
    }

    return input;
}

function parseColorToken(value: string) {
    const input = value.trim();
    const shortHex = input.match(/^#([0-9a-f]{3})$/i);
    if (shortHex) {
        const [r, g, b] = shortHex[1].split("").map((part) => Number.parseInt(part + part, 16));
        return { r, g, b, alpha: null as number | null };
    }

    const hex = input.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const h = hex[1];
        return {
            r: Number.parseInt(h.slice(0, 2), 16),
            g: Number.parseInt(h.slice(2, 4), 16),
            b: Number.parseInt(h.slice(4, 6), 16),
            alpha: null as number | null,
        };
    }

    const rgb = input.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgb) {
        return null;
    }

    const parts = rgb[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
        return null;
    }

    return {
        r: clampColorChannel(parts[0]),
        g: clampColorChannel(parts[1]),
        b: clampColorChannel(parts[2]),
        alpha: parts.length >= 4 && Number.isFinite(parts[3]) ? clampAlpha(parts[3]) : null,
    };
}

function sameRgb(
    left: { r: number; g: number; b: number },
    right: { r: number; g: number; b: number }
) {
    return left.r === right.r && left.g === right.g && left.b === right.b;
}

function withPreservedAlpha(color: string, alpha: number) {
    const parsed = parseColorToken(color);
    if (!parsed) {
        return color;
    }

    return `rgba(${parsed.r},${parsed.g},${parsed.b},${trimAlpha(alpha)})`;
}

function clampColorChannel(value: number) {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function clampAlpha(value: number) {
    return Math.max(0, Math.min(1, value));
}

function trimAlpha(value: number) {
    return Number(value.toFixed(3)).toString();
}

function getFileExtension(file: File) {
    const byMime = file.type.split("/")[1]?.trim().toLowerCase();
    if (byMime) {
        if (byMime === "jpeg") return "jpg";
        if (byMime === "svg+xml") return "svg";
        return byMime;
    }

    const rawName = file.name.split(".").pop()?.trim().toLowerCase();
    if (rawName) {
        return rawName;
    }

    return "png";
}

function downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function slugifyFileName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getTouchDistance(
    first: { clientX: number; clientY: number },
    second: { clientX: number; clientY: number }
) {
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}
