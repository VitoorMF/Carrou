import { useRef, useState, type ChangeEvent } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { auth, storage } from "../../../services/firebase";
import { GENERATE_IMAGE_ENDPOINT } from "../constants";
import type { EditorElement } from "../types";
import type { Carousel } from "../../../editor/canvas/types";

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
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(GENERATE_IMAGE_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

export function useImageEditor({
    projectId,
    activeSlideId,
    selectedEditableElement,
    serverCarousel,
    updateEditableElement,
    persistCarousel,
    setStatusMessage,
    setErrorMessage,
}: {
    projectId: string | undefined;
    activeSlideId: string;
    selectedEditableElement: EditorElement | null;
    serverCarousel: Carousel | null;
    updateEditableElement: (elementId: string, patch: Partial<EditorElement>, options?: { persistDelayMs?: number | null }) => void;
    persistCarousel: (nextCarousel: Carousel) => Promise<void>;
    setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
    setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) {
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const imagePickerRef = useRef<HTMLInputElement | null>(null);

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

    return { isGeneratingImages, imagePickerRef, generateSelectedImage, openImagePicker, handleImageFileChange, removeSelectedImage };
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
        if (patch.w !== undefined) { next.w = patch.w; next.width = patch.w; }
        if (patch.h !== undefined) { next.h = patch.h; next.height = patch.h; }
        if (patch.fontSize !== undefined) next.fontSize = patch.fontSize;
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
