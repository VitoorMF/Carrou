import type { Carousel } from "./schemas";
import { findTemplateById, getDefaultTemplate, resolveTemplateFromPrompt } from "./templateCatalog";

type NormalizeOptions = {
    templateId?: string | null;
    theme?: string | null;
    userPrompt?: string | null;
};

function truncate(value: string, max: number) {
    const text = String(value ?? "").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
}

function paletteForTheme(theme: string) {
    switch (theme) {
        case "luxury":
            return {
                bg: "#F0EBE1",
                text: "#1A1208",
                muted: "#7A6A55",
                accent: "#C2922A",
                accent2: "#8B4513",
            };
        case "editorial3d":
            return {
                bg: "#080F1E",
                text: "#E8F0FF",
                muted: "#5B6FA8",
                accent: "#0EA5E9",
                accent2: "#A855F7",
            };
        case "streetwear":
            return {
                bg: "#0D0D0D",
                text: "#FFFFFF",
                muted: "#A3A3A3",
                accent: "#FF5500",
                accent2: "#FFD600",
            };
        case "microblog":
        default:
            return {
                bg: "#111111",
                text: "#FFFFFF",
                muted: "#C7C7C7",
                accent: "#3B82F6",
                accent2: "#22C55E",
            };
    }
}

export function normalizeCarousel(
    carousel: Carousel,
    options: NormalizeOptions = {}
): Carousel {
    const selectedTemplate = findTemplateById(options.templateId);
    const inferredTemplate = resolveTemplateFromPrompt(options.userPrompt ?? "");
    const activeTemplate = selectedTemplate ?? inferredTemplate ?? getDefaultTemplate();
    const theme = String(options.theme ?? "").trim() || activeTemplate.defaultTheme;
    const palette = paletteForTheme(theme);

    const normalizedSlides = carousel.slides.slice(0, 6).map((slide, slideIndex) => {
        const textElements = slide.elements
            .filter((element) => element.type === "text")
            .slice(0, 4)
            .map((element, index) => ({
                ...element,
                id: element.id?.trim() || `t-${slideIndex + 1}-${index + 1}`,
                text: truncate(element.text, index === 0 ? 120 : 260),
                fill: index === 0 ? palette.text : palette.muted,
            }));

        return {
            id: slide.id?.trim() || `s${slideIndex + 1}`,
            elements: [
                {
                    id: `bg-${slideIndex + 1}`,
                    type: "background" as const,
                    x: 0,
                    y: 0,
                    width: 1080,
                    height: 1350,
                    fill: palette.bg,
                    opacity: 1,
                },
                ...textElements,
            ],
        };
    });

    return {
        meta: {
            ...carousel.meta,
            title: truncate(carousel.meta.title, 120),
            objective: truncate(carousel.meta.objective || "engajar", 80),
            style: activeTemplate.id,
            palette,
        },
        slides: normalizedSlides,
    };
}
