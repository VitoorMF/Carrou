import type { Carousel, CarouselDraft, CreativeDirection } from "./schemas";
import { applyTemplateOverrides, findTemplateById, getDefaultTemplate, inferTemplateFromCreativeDirection, type TemplateId } from "./templateCatalog";
import { buildTemplateElements } from "./normalizers";
import { resolvePalette, resolveSlideRole, sanitizeImageElements, truncateText, type SlideCopy } from "./normalizers/shared";

function inferTemplateId(creativeDirection: CreativeDirection, requested?: string | null): TemplateId {
    const selected = findTemplateById(requested);
    if (selected) return selected.id;
    return inferTemplateFromCreativeDirection(creativeDirection).id;
}

function resolveTheme(requested: string | null | undefined, templateId: TemplateId): string {
    if (requested && String(requested).trim()) return String(requested).trim();
    return findTemplateById(templateId)?.defaultTheme ?? getDefaultTemplate().defaultTheme;
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
    elements: Carousel["slides"][number]["elements"],
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
    creativeDirection: CreativeDirection,
    options: { templateId?: string | null; theme?: string | null } = {}
): Carousel {
    const templateId = inferTemplateId(creativeDirection, options.templateId);
    const effectiveDirection = applyTemplateOverrides(creativeDirection, findTemplateById(templateId) ?? getDefaultTemplate());
    const palette = resolvePalette(effectiveDirection);
    const theme = resolveTheme(options.theme, templateId);

    const slides = draft.slides.slice(0, 8).map((slide, index, all) => {
        const role = slide.role === "cover"
            ? "hook"
            : slide.role === "cta"
                ? "cta"
                : resolveSlideRole(index, all.length);

        const elements = buildTemplateElements({
            templateId,
            slideIndex: index,
            slideCount: all.length,
            role,
            copy: toCopy(slide),
            palette,
            creativeDirection: effectiveDirection,
            theme,
        });

        return {
            id: slide.id || `s${index + 1}`,
            elements: injectImagePrompt(elements, slide.imagePrompt),
        };
    });

    return {
        meta: {
            title: truncateText(draft.meta.title, 120),
            objective: truncateText(draft.meta.objective || creativeDirection.goal, 80),
            style: templateId,
            palette,
        },
        slides,
    };
}
