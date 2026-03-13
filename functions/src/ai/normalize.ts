import type { Carousel, CarouselDraft } from "./schemas";
import { findTemplateById, getDefaultTemplate, inferTemplateFromPrompt, type TemplateCatalogItem, type TemplateId } from "./templateCatalog";
import { buildFlatTemplateCarousel, truncateText, type TemplateDraft } from "../../../shared/templateEngine";

function resolveTemplate(prompt: string, requestedTemplateId?: string | null): TemplateCatalogItem {
    return findTemplateById(requestedTemplateId) ?? inferTemplateFromPrompt(prompt) ?? getDefaultTemplate();
}

function toTemplateDraft(draft: CarouselDraft): TemplateDraft {
    return {
        meta: {
            title: draft.meta.title,
            objective: draft.meta.objective,
        },
        slides: draft.slides.map((slide) => ({
            id: slide.id,
            role: slide.role,
            headline: slide.headline,
            body: slide.body,
            bullets: slide.bullets,
            imagePrompt: slide.imagePrompt,
            notes: slide.notes,
        })),
    };
}

export function normalizeCarousel(
    draft: CarouselDraft,
    options: { prompt: string; templateId?: string | null }
): Carousel & { selectedTemplateId: TemplateId } {
    const template = resolveTemplate(options.prompt, options.templateId);
    const flatCarousel = buildFlatTemplateCarousel(template.id, toTemplateDraft(draft));

    return {
        selectedTemplateId: template.id,
        meta: {
            title: truncateText(flatCarousel.meta.title, 120),
            objective: truncateText(flatCarousel.meta.objective || "engajar", 80),
            style: flatCarousel.meta.style,
            palette: flatCarousel.meta.palette,
        },
        slides: flatCarousel.slides as Carousel["slides"],
    };
}
