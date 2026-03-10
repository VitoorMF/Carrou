export type TemplateId =
    | "streetwearPro"
    | "luxuryMinimal"
    | "microBlogBold"
    | "editorial3D";

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
