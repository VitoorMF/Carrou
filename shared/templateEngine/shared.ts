import type { CarouselElement, ResolvedPalette, SlideRole, TemplateId } from "./types";

export const DOC_W = 1080;
export const DOC_H = 1350;

const DESIGN_PALETTES: Record<TemplateId, ResolvedPalette> = {
    streetwearPro: {
        bg: "#0D0D0D",
        text: "#FFFFFF",
        muted: "#A3A3A3",
        accent: "#FF5500",
        accent2: "#FFD600",
    },
    luxuryMinimal: {
        bg: "#F0EBE1",
        text: "#1A1208",
        muted: "#7A6A55",
        accent: "#C2922A",
        accent2: "#8B4513",
    },
    editorial3D: {
        bg: "#EFF8F8",
        text: "#393939",
        muted: "#646464",
        accent: "#006884",
        accent2: "#375f65",
    },
    glassEditorial: {
        bg: "#1A232A",
        text: "#F7FAFC",
        muted: "#C7D0D9",
        accent: "#8FB7BE",
        accent2: "#C08A5C",
    },
    microBlogBold: {
        bg: "#F5F5F0",
        text: "#0A0A0A",
        muted: "#555555",
        accent: "#2563EB",
        accent2: "#DC2626",
    },
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function truncateText(text: string, max = 220) {
    const value = String(text ?? "").trim();
    if (value.length <= max) return value;
    return value.slice(0, max - 1).trimEnd() + "…";
}

function parseRgb(value: string): [number, number, number] | null {
    const input = value.trim();
    const shortHex = input.match(/^#([0-9a-f]{3})$/i);
    if (shortHex) {
        const [r, g, b] = shortHex[1].split("").map((p) => parseInt(p + p, 16));
        return [r, g, b];
    }
    const hex = input.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const h = hex[1];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const rgb = input.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgb) return null;
    const parts = rgb[1].split(",").map((p) => Number.parseFloat(p.trim()));
    if (parts.length < 3) return null;
    return [clamp(parts[0], 0, 255), clamp(parts[1], 0, 255), clamp(parts[2], 0, 255)];
}

function relativeLuminance(rgb: [number, number, number]) {
    const [r, g, b] = rgb.map((channel) => {
        const n = channel / 255;
        return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isDark(color: string) {
    const rgb = parseRgb(color);
    if (!rgb) return true;
    return relativeLuminance(rgb) < 0.35;
}

export function textOn(background: string) {
    return isDark(background) ? "#FFFFFF" : "#0A0A0A";
}

export function withAlpha(color: string, alpha: number) {
    const rgb = parseRgb(color);
    if (!rgb) return `rgba(255,255,255,${alpha})`;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

export function resolveSlideRole(slideIndex: number, slideCount: number): SlideRole {
    if (slideIndex === 0) return "hook";
    if (slideIndex === slideCount - 1) return "cta";
    return "content";
}

export function resolvePaletteByTemplate(templateId: TemplateId): ResolvedPalette {
    return DESIGN_PALETTES[templateId] ?? DESIGN_PALETTES.microBlogBold;
}

export function sanitizeImageElements(elements: CarouselElement[]): CarouselElement[] {
    return elements.map((element) => {
        if (element.type !== "image" && element.type !== "backgroundImage") return element;

        const sourceUrl = (element as any).url ?? (element as any).src;
        if (sourceUrl) return element;

        if (element.type === "image") {
            return {
                ...element,
                prompt: (element as any).prompt || "professional editorial photo, high quality",
            };
        }

        return element;
    });
}
