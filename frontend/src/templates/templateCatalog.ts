export type TemplateId =
    | "streetwearPro"
    | "luxuryMinimal"
    | "microBlogBold"
    | "editorial3D"
    | "glassEditorial";

export type TemplateCatalogItem = {
    id: TemplateId;
    label: string;
    description: string;
    // Tema padrão usado como fallback no payload para o backend.
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
    {
        id: "glassEditorial",
        label: "Glass Editorial",
        description: "Painel translúcido com linguagem de reportagem visual.",
        defaultTheme: "glass_editorial",
    },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "microBlogBold";

export function findTemplateById(id?: string | null): TemplateCatalogItem | null {
    if (!id) return null;
    return TEMPLATE_CATALOG.find((item) => item.id === id) ?? null;
}
