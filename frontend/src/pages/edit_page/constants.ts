import type { TemplateId } from "../../templates/templateCatalog";
import type { PalettePreset } from "./types";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 0.9;
export const ZOOM_STEP = 0.05;
export const DOC_W = 1080;
export const DOC_H = 1350;
export const STAGE_PADDING = 40;

// Paletas compartilhadas entre todos os templates
const SHARED_PALETTE_PRESETS: PalettePreset[] = [
    {
        id: "shared-ocean",
        label: "Ocean",
        description: "Frio, profundo e moderno",
        palette: { bg: "#0A1628", text: "#E8F4F8", muted: "#7BAFC4", accent: "#00B4D8", accent2: "#0077B6" },
    },
    {
        id: "shared-forest",
        label: "Forest",
        description: "Orgânico e denso",
        palette: { bg: "#0D1F0D", text: "#E8F5E9", muted: "#81C784", accent: "#4CAF50", accent2: "#2E7D32" },
    },
    {
        id: "shared-sunset",
        label: "Sunset",
        description: "Quente e vibrante",
        palette: { bg: "#1A0500", text: "#FFF8F0", muted: "#D4956A", accent: "#FF6B35", accent2: "#F7931A" },
    },
    {
        id: "shared-lavender",
        label: "Lavender",
        description: "Suave e criativo",
        palette: { bg: "#1A0A2E", text: "#F3E8FF", muted: "#C084FC", accent: "#A855F7", accent2: "#7C3AED" },
    },
    {
        id: "shared-rose",
        label: "Rose",
        description: "Ousado e expressivo",
        palette: { bg: "#1A0508", text: "#FFF0F3", muted: "#F9A8B8", accent: "#F43F5E", accent2: "#E11D48" },
    },
    {
        id: "shared-sand",
        label: "Sand",
        description: "Macio e premium",
        palette: { bg: "#F5EFE6", text: "#2C1A0E", muted: "#8B6A4E", accent: "#D4883A", accent2: "#9E5A1F" },
    },
];

export const TEMPLATE_PALETTE_PRESETS: Record<TemplateId, PalettePreset[]> = {
    microBlogBold: SHARED_PALETTE_PRESETS,
    editorial3D: SHARED_PALETTE_PRESETS,
    glassEditorial: SHARED_PALETTE_PRESETS,
    luxuryMinimal: SHARED_PALETTE_PRESETS,
    streetwearPro: SHARED_PALETTE_PRESETS,
};

const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

export const GENERATE_IMAGE_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/generateImageForElement"
    : "https://us-central1-carrosselize.cloudfunctions.net/generateImageForElement";

export const EXPORT_ZIP_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/southamerica-east1/exportCarouselZip"
    : "https://southamerica-east1-carrosselize.cloudfunctions.net/exportCarouselZip";
