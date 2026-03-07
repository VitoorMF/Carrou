// functions/src/ai/normalize.ts
import type { Carousel, CreativeDirection } from "./schemas";

const DOC_W = 1080;
const DOC_H = 1350;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function truncateText(text: string, max = 220) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
}

export function normalizeCarousel(
    carousel: Carousel,
    creativeDirection: CreativeDirection
): Carousel {
    const normalizedSlides = carousel.slides.map((slide, slideIndex) => {
        const seenIds = new Set<string>();

        const elements = slide.elements
            .slice(0, 20)
            .filter((el) => {
                if (creativeDirection.image_strategy === "none" && el.type === "image") {
                    return false;
                }
                return true;
            })
            .map((el, index) => {
                let id = el.id?.trim() || `el_${slideIndex + 1}_${index + 1}`;
                if (seenIds.has(id)) id = `${id}_${index + 1}`;
                seenIds.add(id);

                if (el.type === "text") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: el.width ? clamp(el.width, 80, DOC_W) : 800,
                        fontSize: el.fontSize ? clamp(el.fontSize, 20, 96) : 48,
                        text: truncateText(el.text, 220),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "background") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 1, DOC_W),
                        height: clamp(el.height, 1, DOC_H),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "path") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "image") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 40, DOC_W),
                        height: clamp(el.height, 40, DOC_H),
                        borderRadius: el.borderRadius == null ? 0 : clamp(el.borderRadius, 0, 80),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                        prompt: truncateText(el.prompt, 300),
                    };
                }

                return Object.assign({}, el, { id });
            });

        return {
            ...slide,
            id: slide.id?.trim() || `s${slideIndex + 1}`,
            elements,
        };
    });

    return {
        ...carousel,
        slides: normalizedSlides,
        meta: {
            ...carousel.meta,
            style: carousel.meta.style || creativeDirection.visual_style,
            objective: carousel.meta.objective || creativeDirection.goal,
        },
    };
}