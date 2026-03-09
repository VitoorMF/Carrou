import type { Carousel, CreativeDirection } from "../schemas";
import type { TemplateId } from "../templateCatalog";

export const DOC_W = 1080;
export const DOC_H = 1350;

export type CarouselElement = Carousel["slides"][number]["elements"][number];
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

export type TemplateBuildParams = {
    templateId: TemplateId;
    slideIndex: number;
    slideCount: number;
    role: SlideRole;
    copy: SlideCopy;
    palette: ResolvedPalette;
    creativeDirection: CreativeDirection;
    theme: string;
};

const DESIGN_PALETTES: Record<CreativeDirection["color_mood"], ResolvedPalette> = {
    bold_contrast: {
        bg: "#0D0D0D",
        text: "#FFFFFF",
        muted: "#A3A3A3",
        accent: "#FF5500",
        accent2: "#FFD600",
    },
    neutral_dark: {
        bg: "#101623",
        text: "#F0F4FF",
        muted: "#7B8DB0",
        accent: "#22D3EE",
        accent2: "#7C3AED",
    },
    light_clean: {
        bg: "#F5F5F0",
        text: "#0A0A0A",
        muted: "#555555",
        accent: "#2563EB",
        accent2: "#DC2626",
    },
    premium_warm: {
        bg: "#F0EBE1",
        text: "#1A1208",
        muted: "#7A6A55",
        accent: "#C2922A",
        accent2: "#8B4513",
    },
    tech_cool: {
        bg: "#080F1E",
        text: "#E8F0FF",
        muted: "#5B6FA8",
        accent: "#0EA5E9",
        accent2: "#A855F7",
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

export function extractSlideCopy(elements: CarouselElement[]): SlideCopy {
    const texts = elements
        .filter((el) => el.type === "text")
        .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

    return {
        heading: texts[0]?.text?.trim() || "",
        support: texts[1]?.text?.trim() || "",
        extras: texts
            .slice(2)
            .map((item) => item.text?.trim() || "")
            .filter(Boolean),
    };
}

export function resolvePalette(creativeDirection: CreativeDirection): ResolvedPalette {
    return DESIGN_PALETTES[creativeDirection.color_mood] ?? DESIGN_PALETTES.bold_contrast;
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
