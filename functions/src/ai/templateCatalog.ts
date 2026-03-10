export type TemplateId =
    | "streetwearPro"
    | "luxuryMinimal"
    | "microBlogBold"
    | "editorial3D";

export type TemplateCatalogItem = {
    id: TemplateId;
    label: string;
    description: string;
    defaultTheme: string;
};

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
    {
        id: "streetwearPro",
        label: "Streetwear Pro",
        description: "Alto contraste, tipografia forte e visual chamativo.",
        defaultTheme: "streetwear",
    },
    {
        id: "luxuryMinimal",
        label: "Luxury Minimal",
        description: "Layout elegante, respiro e foco em premium.",
        defaultTheme: "luxury",
    },
    {
        id: "microBlogBold",
        label: "Micro Blog Bold",
        description: "Formato didático, direto e otimizado para conteúdo.",
        defaultTheme: "microblog",
    },
    {
        id: "editorial3D",
        label: "Editorial 3D",
        description: "Layout com profundidade visual e elementos tridimensionais.",
        defaultTheme: "editorial3d",
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

export function inferTemplateFromPrompt(prompt: string): TemplateCatalogItem {
    const value = String(prompt ?? "").toLowerCase();

    if (/luxo|premium|sofistic|elegan|alto padr[aã]o|exclusiv/.test(value)) {
        return findTemplateById("luxuryMinimal") ?? getDefaultTemplate();
    }

    if (/streetwear|urban|hype|moda|drop|sneaker|trap|ousad/.test(value)) {
        return findTemplateById("streetwearPro") ?? getDefaultTemplate();
    }

    if (/3d|editorial|criativo|futur|tecnolog|produto/.test(value)) {
        return findTemplateById("editorial3D") ?? getDefaultTemplate();
    }

    return findTemplateById("microBlogBold") ?? getDefaultTemplate();
}
