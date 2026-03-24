import { useEffect, useMemo, useRef, useState, type ChangeEvent, type TouchEvent } from "react";
import JSZip from "jszip";
import { onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { type CanvasRef } from "../../editor/canvas/Canvas";
import { type Carousel } from "../../editor/canvas/types";
import { useAuth } from "../../lib/hooks/useAuth";
import { applyProfileCardIdentity } from "../../lib/applyProfileCardIdentity";
import { router } from "../../router";
import { auth, db, storage } from "../../services/firebase";
import { findTemplateById } from "../../templates/templateCatalog";
import type { UserData } from "../../types/userData";
import {
    DOC_H,
    DOC_W,
    EXPORT_ZIP_ENDPOINT,
    GENERATE_IMAGE_ENDPOINT,
    MAX_ZOOM,
    MIN_ZOOM,
    STAGE_PADDING,
    TEMPLATE_PALETTE_PRESETS,
    ZOOM_STEP,
} from "./constants";
import { CanvasArea } from "./components/CanvasArea";
import { EditHeader } from "./components/EditHeader";
import { LeftBar } from "./components/LeftBar";
import { RightBar } from "./components/RightBar";
import type {
    EditableElementType,
    EditorElement,
    EditorPalette,
    EditorSlide,
    InspectorElementEntry,
    MobilePanel,
    PaletteKey,
} from "./types";
import "./EditPage.css";

export default function EditPage() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const canvasRef = useRef<CanvasRef>(null);
    const stageContainerRef = useRef<HTMLDivElement | null>(null);
    const imagePickerRef = useRef<HTMLInputElement | null>(null);
    const persistTimeoutRef = useRef<number | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

    const [swipeHint, setSwipeHint] = useState<{ direction: "left" | "right"; progress: number } | null>(null);

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
    const [selectedPalettePresetId, setSelectedPalettePresetId] = useState<string | null>(null);
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
            if (selectedPalettePresetId === "original" && originalPalette && palettesEqual(originalPalette, activePalette)) {
                return "original";
            }

            if (selectedPalettePresetId) {
                const selectedPreset = palettePresets.find((preset) => preset.id === selectedPalettePresetId);
                if (selectedPreset && palettesEqual(selectedPreset.palette, activePalette)) {
                    return selectedPreset.id;
                }
            }

            const matchingPresetId = palettePresets.find((preset) => palettesEqual(preset.palette, activePalette))?.id ?? null;
            if (matchingPresetId) {
                return matchingPresetId;
            }

            if (originalPalette && palettesEqual(originalPalette, activePalette)) {
                return "original";
            }

            return null;
        },
        [activePalette, originalPalette, palettePresets, selectedPalettePresetId]
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
        if (event.touches.length === 2 && pinchStartRef.current) {
            const distance = getTouchDistance(event.touches[0], event.touches[1]);
            const scaleFactor = distance / pinchStartRef.current.distance;
            const nextZoom = Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, Number((pinchStartRef.current.zoom * scaleFactor).toFixed(2)))
            );
            setHasManualZoom(true);
            setZoom((current) => (Math.abs(current - nextZoom) < 0.01 ? current : nextZoom));
            return;
        }

        if (event.touches.length === 1 && swipeStartRef.current && !selectedElementId) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - swipeStartRef.current.x;
            const deltaY = touch.clientY - swipeStartRef.current.y;
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                const progress = Math.min(Math.abs(deltaX) / 80, 1);
                setSwipeHint({ direction: deltaX < 0 ? "right" : "left", progress });
                return;
            }
        }

        setSwipeHint(null);
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

        setSwipeHint(null);

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

    function friendlyImageError(message?: string): string {
        if (!message) return "Não foi possível gerar a imagem. Tente novamente.";
        if (message.includes("crédit") || message.includes("insuficiente") || message.includes("saldo"))
            return "Créditos insuficientes. Adquira mais para continuar gerando imagens.";
        if (message.includes("network") || message.includes("fetch") || message.includes("Failed to fetch"))
            return "Sem conexão. Verifique sua internet e tente novamente.";
        if (message.includes("auth") || message.includes("unauthenticated") || message.includes("autenticad"))
            return "Sessão expirada. Recarregue a página e tente novamente.";
        if (message.includes("timeout") || message.includes("AbortError") || message.includes("demorou"))
            return "A geração demorou demais. Tente novamente.";
        if (message.includes("prompt") || message.includes("content") || message.includes("policy"))
            return "Prompt não permitido. Tente reformular a descrição da imagem.";
        if (message.includes("rate") || message.includes("limit") || message.includes("quota"))
            return "Muitas requisições. Aguarde alguns segundos e tente novamente.";
        return "Não foi possível gerar a imagem. Tente novamente.";
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
            setErrorMessage(friendlyImageError(error instanceof Error ? error.message : undefined));
        } finally {
            setIsGeneratingImages(false);
        }
    }

    async function shareAllSlides() {
        if (!serverCarousel || serverCarousel.slides.length === 0) return;

        setStatusMessage("Preparando para compartilhar...");
        setErrorMessage(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("Usuário não autenticado.");

            const response = await fetch(EXPORT_ZIP_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ projectId }),
            });

            if (!response.ok) throw new Error(await response.text());

            const zipBlob = await response.blob();
            const zip = await JSZip.loadAsync(zipBlob);
            const baseName = slugifyFileName(projectName || "carrossel") || "carrossel";

            const files: File[] = await Promise.all(
                Object.entries(zip.files)
                    .filter(([, entry]) => !entry.dir)
                    .map(async ([name, entry]) => {
                        const blob = await entry.async("blob");
                        return new File([blob], name, { type: "image/png" });
                    })
            );

            if (!navigator.share || !navigator.canShare?.({ files })) {
                downloadBlob(zipBlob, `${baseName}.zip`);
                setStatusMessage("ZIP baixado.");
                return;
            }

            await navigator.share({ files, title: projectName || "Carrossel" });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
            console.error(error);
            setErrorMessage("Não foi possível compartilhar os slides.");
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
        setSelectedPalettePresetId(null);
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

    function applyPalettePreset(palette: EditorPalette, presetId: string) {
        setSelectedPalettePresetId(presetId);
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
            <EditHeader
                projectName={projectName}
                zoom={zoom}
                isExportingAllSlides={isExportingAllSlides}
                hasServerCarousel={Boolean(serverCarousel)}
                onBack={() => router.navigate("/")}
                onProjectNameChange={setProjectName}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                onZoomIn={zoomIn}
                onExportAllSlides={exportAllSlides}
            />

            <div className="editor_workspace">
                <LeftBar
                    mobilePanel={mobilePanel}
                    slides={slides}
                    activeSlideId={activeSlideId}
                    getSlideLabel={getSlideListLabel}
                    onSelectSlide={goToSlide}
                    onCloseMobilePanel={() => setMobilePanel(null)}
                />

                <CanvasArea
                    slidesCount={slides.length}
                    activeSlideIndex={activeSlideIndex}
                    isLoadingProject={isLoadingProject}
                    statusMessage={statusMessage}
                    errorMessage={errorMessage}
                    stageContainerRef={stageContainerRef}
                    canvasRef={canvasRef}
                    renderedCarousel={renderedCarousel}
                    zoom={zoom}
                    selectedElementId={selectedElementId}
                    onTouchStart={handleStageTouchStart}
                    onTouchMove={handleStageTouchMove}
                    onTouchEnd={handleStageTouchEnd}
                    onSelectElement={(elementId) => {
                        setSelectedElementId(elementId);
                        setLiveElementPosition(null);
                    }}
                    onElementLivePositionChange={handleElementLivePositionChange}
                    onElementPositionChange={handleElementPositionChange}
                    onExportPNG={() => {
                        setStatusMessage(`Slide ${activeSlideIndex + 1} exportado em PNG.`);
                    }}
                    onDismissError={() => setErrorMessage(null)}
                    swipeHint={swipeHint}
                />

                <RightBar
                    mobilePanel={mobilePanel}
                    editableSelectedElement={editableSelectedElement}
                    selectedElementPosition={selectedElementPosition}
                    isGeneratingImages={isGeneratingImages}
                    activePalette={activePalette}
                    originalPalette={originalPalette}
                    palettePresets={palettePresets}
                    activePalettePresetId={activePalettePresetId}
                    isAdvancedPaletteOpen={isAdvancedPaletteOpen}
                    activeInspectorElements={activeInspectorElements}
                    selectedElementId={selectedElementId}
                    activeSlide={activeSlide}
                    onTextContentChange={handleTextContentChange}
                    onGenerateSelectedImage={generateSelectedImage}
                    onOpenImagePicker={openImagePicker}
                    onRemoveSelectedImage={removeSelectedImage}
                    onElementCoordinateChange={handleElementCoordinateChange}
                    onApplyPalettePreset={applyPalettePreset}
                    onToggleAdvancedPalette={() => setIsAdvancedPaletteOpen((current) => !current)}
                    onPaletteChange={handlePaletteChange}
                    onSelectInspectorElement={(elementId) => {
                        setSelectedElementId(elementId);
                        setLiveElementPosition(null);
                    }}
                    getInspectorElementPreview={getInspectorElementPreview}
                    renderInspectorElementIcon={renderInspectorElementIcon}
                />
            </div>
            <div className={`export_drawer ${mobilePanel === "export" ? "is_open" : ""}`}>
                <span className="export_panel_title">Exportar slides</span>
                <div className="export_panel_options">
                    <button
                        type="button"
                        className="export_option_btn"
                        onClick={exportAllSlides}
                        disabled={isExportingAllSlides}
                    >
                        <span className="export_option_icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </span>
                        <div className="export_option_info">
                            <strong>{isExportingAllSlides ? "Gerando ZIP..." : "Baixar todos"}</strong>
                            <span>Todos os slides em PNG dentro de um ZIP</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        className="export_option_btn"
                        onClick={() => void shareAllSlides()}
                    >
                        <span className="export_option_icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                        </span>
                        <div className="export_option_info">
                            <strong>Compartilhar slide atual</strong>
                            <span>Abre o menu de compartilhamento do celular</span>
                        </div>
                    </button>
                </div>
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
                    className={`mobile_dock_button is_primary ${mobilePanel === "export" ? "is_active" : ""}`}
                    onClick={() => setMobilePanel((current) => current === "export" ? null : "export")}
                >
                    <span className="mobile_dock_label">Exportar</span>
                    <span className="mobile_dock_value">Slides</span>
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

function resetStalePendingElements(carousel: Carousel): Carousel {
    return {
        ...carousel,
        slides: carousel.slides.map((slide: any) => {
            const resetLayer = (elements: any[] | undefined) =>
                elements?.map((el: any) =>
                    el?.status === "pending" && !el?.url && !el?.src
                        ? { ...el, status: "idle" }
                        : el
                );
            if (slide?.layers) {
                return {
                    ...slide,
                    layers: {
                        background: resetLayer(slide.layers.background),
                        atmosphere: resetLayer(slide.layers.atmosphere),
                        content: resetLayer(slide.layers.content),
                        ui: resetLayer(slide.layers.ui),
                    },
                };
            }
            if (Array.isArray(slide?.elements)) {
                return { ...slide, elements: resetLayer(slide.elements) };
            }
            return slide;
        }),
    };
}

function projectDocToCarousel(data: any): Carousel {
    // Fonte de verdade do editor: payload final de render persistido no backend.
    if (data?.renderCarousel?.meta && Array.isArray(data?.renderCarousel?.slides)) {
        const fromRender = resetStalePendingElements(data.renderCarousel as Carousel);
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

    const legacyPaletteKey = getLegacyPaletteKey(input);
    if (legacyPaletteKey) {
        const nextColor = nextPalette[legacyPaletteKey];
        if (inputColor.alpha !== null && inputColor.alpha < 1) {
            return withPreservedAlpha(nextColor, inputColor.alpha);
        }

        return nextColor;
    }

    return input;
}

function getLegacyPaletteKey(input: string): PaletteKey | null {
    const normalized = input.trim().toLowerCase();

    const legacyMap: Record<string, PaletteKey> = {
        "#6b5548": "bg",
        "#111111": "bg",
        "#9a7c60": "accent2",
        "#f5f1ec": "text",
        "#f3ece6": "text",
        "#f1e8de": "text",
        "#ffffff": "text",
        "#eeeae5": "muted",
        "#f4ece4": "muted",
        "#f5ece2": "text",
        "#f6efe8": "text",
        "#a8896b": "accent",
    };

    return legacyMap[normalized] ?? null;
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
