import type { CreativeDirection } from "./schemas";

export type TemplateId =
    | "streetwearPro"
    | "luxuryMinimal"
    | "microBlogBold"
    | "editorial3D";

type CreativeOverrides = Pick<
    CreativeDirection,
    "visual_style" | "color_mood" | "layout_energy" | "image_strategy"
>;

export type TemplateCatalogItem = {
    id: TemplateId;
    label: string;
    description: string;
    defaultTheme: string;
    overrides: CreativeOverrides;
};

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
    {
        id: "streetwearPro",
        label: "Streetwear Pro",
        description: "Alto contraste, tipografia forte e visual chamativo.",
        defaultTheme: "streetwear",
        overrides: {
            visual_style: "social_dynamic",
            color_mood: "bold_contrast",
            layout_energy: "high",
            image_strategy: "supportive",
        },
    },
    {
        id: "luxuryMinimal",
        label: "Luxury Minimal",
        description: "Layout elegante, respiro e foco em premium.",
        defaultTheme: "luxury",
        overrides: {
            visual_style: "luxury_minimal",
            color_mood: "premium_warm",
            layout_energy: "low",
            image_strategy: "minimal",
        },
    },
    {
        id: "microBlogBold",
        label: "Micro Blog Bold",
        description: "Formato didático, direto e otimizado para conteúdo.",
        defaultTheme: "microblog",
        overrides: {
            visual_style: "microblog_bold",
            color_mood: "bold_contrast",
            layout_energy: "high",
            image_strategy: "supportive",
        },
    },
    {
        id: "editorial3D",
        label: "Editorial 3D",
        description: "Layout com profundidade visual e elementos tridimensionais.",
        defaultTheme: "editorial3d",
        overrides: {
            visual_style: "social_dynamic",
            color_mood: "tech_cool",
            layout_energy: "high",
            image_strategy: "supportive",
        },
    },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "microBlogBold";

const TEMPLATE_ID_ALIASES: Record<string, TemplateId> = {
    streetwearpro: "streetwearPro",
    luxuryminimal: "luxuryMinimal",
    microblogbold: "microBlogBold",
    editorial3d: "editorial3D",
};

function normalizeTemplateToken(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()
        .trim();
}

export function findTemplateById(id?: string | null): TemplateCatalogItem | null {
    if (!id) return null;

    const normalized = normalizeTemplateToken(id);
    const canonicalId = TEMPLATE_ID_ALIASES[normalized];
    if (!canonicalId) return null;

    return TEMPLATE_CATALOG.find((item) => item.id === canonicalId) ?? null;
}

export function getDefaultTemplate(): TemplateCatalogItem {
    return TEMPLATE_CATALOG.find((item) => item.id === DEFAULT_TEMPLATE_ID) ?? TEMPLATE_CATALOG[0];
}

export function inferTemplateFromCreativeDirection(
    creativeDirection: CreativeDirection
): TemplateCatalogItem {
    switch (creativeDirection.visual_style) {
        case "luxury_minimal":
            return findTemplateById("luxuryMinimal") ?? getDefaultTemplate();
        case "microblog_bold":
            return findTemplateById("microBlogBold") ?? getDefaultTemplate();
        case "social_dynamic":
            return findTemplateById("streetwearPro") ?? getDefaultTemplate();
        case "editorial_minimal":
        case "clean_modern":
        default:
            return findTemplateById("editorial3D") ?? getDefaultTemplate();
    }
}

export function applyTemplateOverrides(
    creativeDirection: CreativeDirection,
    template: TemplateCatalogItem
): CreativeDirection {
    return {
        ...creativeDirection,
        ...template.overrides,
    };
}
