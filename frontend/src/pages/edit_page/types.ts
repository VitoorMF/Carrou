export type EditorElement = {
    id: string;
    type: string;
    x?: number;
    y?: number;
    prompt?: string;
    src?: string;
    status?: string;
    [key: string]: unknown;
};

export type EditorSlide = {
    id: string;
    name: string;
    elements: EditorElement[];
    background?: { type: "solid"; value: string };
};

export type InspectorElementEntry = {
    id: string;
    type: string;
    name?: string;
    layer: "background" | "atmosphere" | "content" | "ui" | "flat";
};

export type EditableElementType = "text" | "image" | "backgroundImage";

export type MobilePanel = "slides" | "inspector" | "export" | null;

export type PaletteKey = "bg" | "text" | "muted" | "accent" | "accent2";

export type EditorPalette = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};

export type PalettePreset = {
    id: string;
    label: string;
    description: string;
    palette: EditorPalette;
};
