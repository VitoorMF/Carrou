import type { TemplateId } from "../../templates/templateCatalog";
import type { PalettePreset } from "./types";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 0.9;
export const ZOOM_STEP = 0.05;
export const DOC_W = 1080;
export const DOC_H = 1350;
export const STAGE_PADDING = 40;

export const TEMPLATE_PALETTE_PRESETS: Record<TemplateId, PalettePreset[]> = {
    microBlogBold: [
        {
            id: "microblog-paper",
            label: "Paper",
            description: "Claro e editorial",
            palette: {
                bg: "#FAF7F0",
                text: "#1C1008",
                muted: "#8B7355",
                accent: "#B5451B",
                accent2: "#4A6741",
            },
        },
        {
            id: "microblog-night",
            label: "Night",
            description: "Escuro e direto",
            palette: {
                bg: "#0F172A",
                text: "#F8FAFC",
                muted: "#94A3B8",
                accent: "#38BDF8",
                accent2: "#F97316",
            },
        },
        {
            id: "microblog-ink",
            label: "Ink",
            description: "Mais sóbrio e jornal",
            palette: {
                bg: "#F8FAFC",
                text: "#111827",
                muted: "#6B7280",
                accent: "#1D4ED8",
                accent2: "#0F766E",
            },
        },
    ],
    editorial3D: [
        {
            id: "editorial-aqua",
            label: "Abyss",
            description: "Frio, tridimensional e escuro",
            palette: {
                bg: "#0F1720",
                text: "#E6FCFF",
                muted: "#8FB7BE",
                accent: "#2DD4D7",
                accent2: "#0E7490",
            },
        },
        {
            id: "editorial-lilac",
            label: "Lilac",
            description: "Mais experimental",
            palette: {
                bg: "#F4F2FF",
                text: "#221B3A",
                muted: "#7A7396",
                accent: "#6D5EF8",
                accent2: "#EC4899",
            },
        },
        {
            id: "editorial-sand",
            label: "Sand",
            description: "Macio e premium",
            palette: {
                bg: "#FAF4EC",
                text: "#3B2F2F",
                muted: "#8A7469",
                accent: "#C08457",
                accent2: "#6B7280",
            },
        },
    ],
    glassEditorial: [
        {
            id: "glass-storm",
            label: "Storm",
            description: "Frio, jornalístico e denso",
            palette: {
                bg: "#1A232A",
                text: "#F7FAFC",
                muted: "#C7D0D9",
                accent: "#8FB7BE",
                accent2: "#C08A5C",
            },
        },
        {
            id: "glass-ember",
            label: "Ember",
            description: "Mais quente e dramático",
            palette: {
                bg: "#221C1A",
                text: "#FFF8F2",
                muted: "#D9C8BC",
                accent: "#E8A15B",
                accent2: "#7A3E1D",
            },
        },
        {
            id: "glass-frost",
            label: "Frost",
            description: "Claro e documental",
            palette: {
                bg: "#E9EEF1",
                text: "#17212B",
                muted: "#5F7181",
                accent: "#6A8CA5",
                accent2: "#A66C4A",
            },
        },
    ],
    luxuryMinimal: [
        {
            id: "luxury-gold",
            label: "Gold",
            description: "Clássico premium",
            palette: {
                bg: "#F0EBE1",
                text: "#1A1208",
                muted: "#7A6A55",
                accent: "#C2922A",
                accent2: "#8B4513",
            },
        },
        {
            id: "luxury-noir",
            label: "Noir",
            description: "Luxo mais escuro",
            palette: {
                bg: "#161616",
                text: "#F6F1E8",
                muted: "#B8AFA0",
                accent: "#D4A64A",
                accent2: "#8B5E3C",
            },
        },
        {
            id: "luxury-rose",
            label: "Rose",
            description: "Suave e sofisticado",
            palette: {
                bg: "#F8F2EF",
                text: "#2B1D1A",
                muted: "#8E746A",
                accent: "#C87B6A",
                accent2: "#9A5B4F",
            },
        },
    ],
    streetwearPro: [
        {
            id: "streetwear-fire",
            label: "Fire",
            description: "Contraste alto e energia",
            palette: {
                bg: "#0D0D0D",
                text: "#FFFFFF",
                muted: "#A3A3A3",
                accent: "#FF5500",
                accent2: "#FFD600",
            },
        },
        {
            id: "streetwear-neon",
            label: "Neon",
            description: "Mais urbano e vibrante",
            palette: {
                bg: "#050816",
                text: "#F8FAFC",
                muted: "#94A3B8",
                accent: "#22D3EE",
                accent2: "#F43F5E",
            },
        },
        {
            id: "streetwear-lime",
            label: "Lime",
            description: "Agressivo e moderno",
            palette: {
                bg: "#101010",
                text: "#F5F5F5",
                muted: "#B3B3B3",
                accent: "#A3E635",
                accent2: "#F97316",
            },
        },
    ],
};

const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

export const GENERATE_IMAGE_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/generateImageForElement"
    : "https://us-central1-carrosselize.cloudfunctions.net/generateImageForElement";

export const EXPORT_ZIP_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/southamerica-east1/exportCarouselZip"
    : "https://southamerica-east1-carrosselize.cloudfunctions.net/exportCarouselZip";
