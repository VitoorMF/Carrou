export type TemplateId =
    | "streetwearPro"
    | "luxuryMinimal"
    | "microBlogBold"
    | "editorial3D"
    | "glassEditorial";

export type SlideRole = "hook" | "content" | "cta";

export type SlideCopy = {
    heading: string;
    support: string;
    extras: string[];
};

export type ResolvedPalette = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};

export type CarouselElement = {
    id: string;
    type: string;
    [key: string]: unknown;
};

export type TemplateBuildParams = {
    templateId: TemplateId;
    slideIndex: number;
    slideCount: number;
    role: SlideRole;
    copy: SlideCopy;
    palette: ResolvedPalette;
};

export type TemplateDraftSlide = {
    id?: string;
    role?: "cover" | "content" | "cta";
    headline?: string;
    body?: string;
    bullets?: string[];
    imagePrompt?: string;
    notes?: string;
};

export type TemplateDraftMeta = {
    title?: string;
    objective?: string;
    theme?: string;
};

export type TemplateDraft = {
    meta: TemplateDraftMeta;
    slides: TemplateDraftSlide[];
};
