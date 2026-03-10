import type { Carousel, CarouselDraft } from "./schemas";
import { findTemplateById, getDefaultTemplate, inferTemplateFromPrompt, type TemplateCatalogItem, type TemplateId } from "./templateCatalog";
import { buildTemplateElements } from "./normalizers";
import { resolvePaletteByTemplate, resolveSlideRole, sanitizeImageElements, truncateText, type SlideCopy } from "./normalizers/shared";

function resolveTemplate(prompt: string, requestedTemplateId?: string | null): TemplateCatalogItem {
    return findTemplateById(requestedTemplateId) ?? inferTemplateFromPrompt(prompt) ?? getDefaultTemplate();
}

function toCopy(slide: CarouselDraft["slides"][number]): SlideCopy {
    const extras = Array.isArray(slide.bullets)
        ? slide.bullets.map((item) => truncateText(item, 90)).filter(Boolean)
        : [];

    return {
        heading: truncateText(slide.headline, 140),
        support: truncateText(slide.body ?? "", 320),
        extras,
    };
}

function injectImagePrompt(
    elements: any[],
    imagePrompt?: string
) {
    if (!imagePrompt) return elements;

    let applied = false;
    const next = elements.map((element) => {
        if (applied) return element;
        if (element.type !== "image" && element.type !== "backgroundImage") return element;
        applied = true;
        return {
            ...element,
            prompt: imagePrompt,
        };
    });

    return sanitizeImageElements(next);
}

export function normalizeCarousel(
    draft: CarouselDraft,
    options: { prompt: string; templateId?: string | null }
): Carousel & { selectedTemplateId: TemplateId } {
    const template = resolveTemplate(options.prompt, options.templateId);
    const palette = resolvePaletteByTemplate(template.id);

    const slides = draft.slides.slice(0, 8).map((slide, index, all) => {
        const role = slide.role === "cover"
            ? "hook"
            : slide.role === "cta"
                ? "cta"
                : resolveSlideRole(index, all.length);

        const elements = buildTemplateElements({
            templateId: template.id,
            slideIndex: index,
            slideCount: all.length,
            role,
            copy: toCopy(slide),
            palette,
        });

        return {
            id: slide.id || `s${index + 1}`,
            elements: injectImagePrompt(elements as any[], slide.imagePrompt) as Carousel["slides"][number]["elements"],
        };
    });

    return {
        selectedTemplateId: template.id,
        meta: {
            title: truncateText(draft.meta.title, 120),
            objective: truncateText(draft.meta.objective || "engajar", 80),
            style: template.id,
            palette,
        },
        slides,
    };
}
