import { buildTemplateElements } from "./buildTemplateElements";
import { resolvePaletteByTemplate, resolveSlideRole, sanitizeImageElements, truncateText } from "./shared";
import type { CarouselElement, ResolvedPalette, TemplateDraft, TemplateDraftSlide, TemplateId } from "./types";

type FlatTemplateSlide = {
    id: string;
    elements: CarouselElement[];
};

type LayeredTemplateSlide = {
    id: string;
    layers: {
        background: CarouselElement[];
        atmosphere: CarouselElement[];
        content: CarouselElement[];
        ui: CarouselElement[];
    };
};

type TemplateRenderMeta = {
    title: string;
    style: TemplateId;
    objective: string;
    theme?: string;
    palette: ReturnType<typeof resolvePaletteByTemplate>;
};

type FlatTemplateCarousel = {
    meta: TemplateRenderMeta;
    slides: FlatTemplateSlide[];
};

type LayeredTemplateCarousel = {
    meta: TemplateRenderMeta;
    slides: LayeredTemplateSlide[];
};

function toCopy(slide: TemplateDraftSlide) {
    const extras = Array.isArray(slide.bullets)
        ? slide.bullets.map((item) => truncateText(item, 90)).filter(Boolean)
        : [];

    return {
        heading: truncateText(slide.headline ?? "", 140),
        support: truncateText(slide.body ?? "", 320),
        extras,
    };
}

function applyImagePrompt(elements: CarouselElement[], prompt?: string) {
    if (!prompt?.trim()) {
        return sanitizeImageElements(elements);
    }

    let applied = false;
    return sanitizeImageElements(elements.map((element) => {
        if (applied) return element;
        if (element.type !== "image" && element.type !== "backgroundImage") return element;
        applied = true;
        return { ...element, prompt: prompt.trim() };
    }));
}

export function toLayeredSlide(slide: FlatTemplateSlide): LayeredTemplateSlide {
    const background: CarouselElement[] = [];
    const atmosphere: CarouselElement[] = [];
    const content: CarouselElement[] = [];
    const ui: CarouselElement[] = [];

    for (const el of slide.elements ?? []) {
        if (el.type === "background") {
            background.push(el);
            continue;
        }

        if (
            el.type === "backgroundImage"
            || el.type === "noise"
            || el.type === "gradientRect"
            || el.type === "glow"
        ) {
            atmosphere.push(el);
            continue;
        }

        content.push(el);
    }

    return { id: slide.id, layers: { background, atmosphere, content, ui } };
}

export function buildFlatTemplateCarousel(templateId: TemplateId, draft: TemplateDraft, paletteOverride?: Partial<ResolvedPalette>): FlatTemplateCarousel {
    const palette = paletteOverride
        ? { ...resolvePaletteByTemplate(templateId), ...paletteOverride }
        : resolvePaletteByTemplate(templateId);

    const slides = (draft.slides ?? []).slice(0, 8).map((slide, index, all) => {
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
        });

        const prompt = slide.imagePrompt?.trim() || slide.notes?.trim();

        return {
            id: slide.id || `s${index + 1}`,
            elements: applyImagePrompt(elements, prompt),
        };
    });

    return {
        meta: {
            title: truncateText(draft.meta?.title ?? "Playground", 120),
            style: templateId,
            palette,
            objective: truncateText(draft.meta?.objective ?? "engajar", 80),
            theme: draft.meta?.theme,
        },
        slides,
    };
}

export function buildLayeredTemplateCarousel(templateId: TemplateId, draft: TemplateDraft, paletteOverride?: Partial<ResolvedPalette>): LayeredTemplateCarousel {
    const flat = buildFlatTemplateCarousel(templateId, draft, paletteOverride);
    return {
        ...flat,
        slides: flat.slides.map(toLayeredSlide),
    };
}
