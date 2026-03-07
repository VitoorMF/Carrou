// functions/src/ai/normalize.ts
import type { Carousel, CreativeDirection } from "./schemas";

const DOC_W = 1080;
const DOC_H = 1350;
const BRAND_ACCENT = "#F77E58";
const BRAND_ACCENT_2 = "#FDBA74";
const BRAND_TEXT = "#202632";
const BRAND_MUTED = "#6B7280";
const BRAND_BG = "#FFF9F5";

type CarouselElement = Carousel["slides"][number]["elements"][number];
type Palette = NonNullable<Carousel["meta"]["palette"]>;
type TextElement = Extract<CarouselElement, { type: "text" }>;
type PathElement = Extract<CarouselElement, { type: "path" }>;
type GradientElement = Extract<CarouselElement, { type: "gradientRect" }>;
type GlowElement = Extract<CarouselElement, { type: "glow" }>;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function truncateText(text: string, max = 220) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
}

function normalizeFontStyle(raw?: string, isHeading = false): "normal" | "bold" | "italic" | "bold italic" {
    if (!raw) return isHeading ? "bold" : "normal";
    const value = raw.toLowerCase().trim();

    if (value === "normal" || value === "regular" || value === "400" || value === "500") return "normal";
    if (value === "bold" || value === "600" || value === "700" || value === "800") return "bold";
    if (value === "italic") return "italic";
    if (value === "bold italic" || value === "italic bold") return "bold italic";
    return isHeading ? "bold" : "normal";
}

function toRgba(hexOrCss: string, alpha = 0.2) {
    if (!hexOrCss) return `rgba(255,255,255,${alpha})`;
    if (hexOrCss.startsWith("rgba") || hexOrCss.startsWith("rgb")) return hexOrCss;

    const hex = hexOrCss.replace("#", "");
    if (hex.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function normalizeFontFamily(fontFamily?: string) {
    if (!fontFamily) return "Poppins";

    const normalized = fontFamily.toLowerCase();
    const generic =
        normalized.includes("arial")
        || normalized.includes("helvetica")
        || normalized.includes("times")
        || normalized.includes("courier")
        || normalized.includes("sans");

    return generic ? "Poppins" : fontFamily;
}

function normalizeHexColor(value: string | undefined, fallback: string) {
    if (!value) return fallback;
    return value;
}

function parseRgb(value: string): [number, number, number] | null {
    const input = value.trim();

    const shortHexMatch = input.match(/^#([0-9a-f]{3})$/i);
    if (shortHexMatch) {
        const [r, g, b] = shortHexMatch[1].split("").map((part) => parseInt(part + part, 16));
        return [r, g, b];
    }

    const hexMatch = input.match(/^#([0-9a-f]{6})$/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
    }

    const rgbMatch = input.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgbMatch) return null;

    const parts = rgbMatch[1].split(",").map((part) => part.trim());
    if (parts.length < 3) return null;

    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);

    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
}

function relativeLuminance(rgb: [number, number, number]) {
    const [r, g, b] = rgb.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(colorA: string, colorB: string) {
    const rgbA = parseRgb(colorA);
    const rgbB = parseRgb(colorB);
    if (!rgbA || !rgbB) return 21;

    const lumA = relativeLuminance(rgbA);
    const lumB = relativeLuminance(rgbB);
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return (lighter + 0.05) / (darker + 0.05);
}

function preferredTextColor(background: string) {
    const rgb = parseRgb(background);
    if (!rgb) return "#111827";
    return relativeLuminance(rgb) < 0.35 ? "#F8FAFC" : "#111827";
}

function ensureTextContrast(fill: string, background: string, fallback: string) {
    const ratio = contrastRatio(fill, background);
    return ratio < 3.2 ? fallback : fill;
}

function withAlpha(color: string, alpha: number) {
    const rgb = parseRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp(alpha, 0, 1)})`;
}

function mixHexColors(a: string, b: string, t: number) {
    const ra = parseRgb(a);
    const rb = parseRgb(b);
    if (!ra || !rb) return a;
    const ratio = clamp(t, 0, 1);

    const mixed = [
        Math.round(ra[0] + (rb[0] - ra[0]) * ratio),
        Math.round(ra[1] + (rb[1] - ra[1]) * ratio),
        Math.round(ra[2] + (rb[2] - ra[2]) * ratio),
    ];

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(mixed[0])}${toHex(mixed[1])}${toHex(mixed[2])}`;
}

function resolveSlideBackgroundColor(palette: Palette, slideIndex: number) {
    const variants = [0.08, 0.15, 0.1, 0.18, 0.12, 0.2];
    const ratio = variants[slideIndex % variants.length];
    return mixHexColors(palette.bg ?? BRAND_BG, "#ffffff", ratio);
}

function sanitizePalette(
    palette: {
        bg?: string;
        text?: string;
        muted?: string;
        accent?: string;
        accent2?: string;
    } | undefined
) {
    const requestedBg = normalizeHexColor(palette?.bg, BRAND_BG);
    const bg = mixHexColors(requestedBg, BRAND_BG, 0.6);

    return {
        bg,
        text: normalizeHexColor(palette?.text, BRAND_TEXT),
        muted: normalizeHexColor(palette?.muted, BRAND_MUTED),
        accent: BRAND_ACCENT,
        accent2: BRAND_ACCENT_2,
    };
}

function ensureBackgroundElement(elements: CarouselElement[], slideIndex: number, palette: Palette): CarouselElement[] {
    const hasBackground = elements.some((el) => el.type === "background");
    if (hasBackground) {
        return elements;
    }

    return [
        {
            id: `auto_bg_${slideIndex + 1}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: resolveSlideBackgroundColor(palette, slideIndex),
            opacity: 1,
        } as CarouselElement,
        ...elements,
    ];
}

function pathLooksTiny(data: string) {
    const compact = data.replace(/\s+/g, " ").trim();
    if (compact.length < 40) return true;
    return /^M10 10 H 90 V 90 H 10 L 10 10$/i.test(compact);
}

function hasHeroVisualBlock(elements: CarouselElement[]) {
    return elements.some((el) => {
        if (el.type !== "image" && el.type !== "backgroundImage" && el.type !== "glassCard") {
            return false;
        }
        return el.width * el.height >= 180000;
    });
}

function ensureVisualRichness(
    elements: CarouselElement[],
    slideIndex: number,
    palette: Palette
): CarouselElement[] {
    const accent = palette.accent ?? BRAND_ACCENT;
    const accent2 = palette.accent2 ?? BRAND_ACCENT_2;

    const injected: CarouselElement[] = [...elements];

    const hasGradient = injected.some((el) => el.type === "gradientRect");
    if (!hasGradient) {
        const diagonal = slideIndex % 2 === 0;
        injected.push({
            id: `auto_grad_${slideIndex + 1}`,
            type: "gradientRect",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            kind: "linear",
            start: diagonal ? { x: 0, y: 0 } : { x: DOC_W, y: 0 },
            end: diagonal ? { x: DOC_W, y: DOC_H } : { x: 0, y: DOC_H },
            stops: [0, toRgba(accent, 0.2), 1, toRgba(accent2, 0.08)],
            opacity: 1,
        } as CarouselElement);
    }

    const hasGlow = injected.some((el) => el.type === "glow");
    if (!hasGlow) {
        const corner = slideIndex % 3;
        injected.push({
            id: `auto_glow_${slideIndex + 1}`,
            type: "glow",
            x: corner === 0 ? DOC_W * 0.86 : corner === 1 ? DOC_W * 0.12 : DOC_W * 0.78,
            y: corner === 0 ? DOC_H * 0.16 : corner === 1 ? DOC_H * 0.84 : DOC_H * 0.74,
            r: 300,
            color: accent,
            blur: 110,
            opacity: 0.18,
        } as CarouselElement);
    }

    if (!hasHeroVisualBlock(injected)) {
        const isEven = slideIndex % 2 === 0;
        injected.push({
            id: `auto_card_${slideIndex + 1}`,
            type: "glassCard",
            x: isEven ? 84 : 164,
            y: isEven ? 760 : 660,
            width: isEven ? 912 : 760,
            height: isEven ? 360 : 320,
            radius: 34,
            fill: toRgba("#ffffff", 0.5),
            stroke: toRgba(accent, 0.24),
            strokeWidth: 1,
            opacity: 0.72,
        } as CarouselElement);
    }

    const hasDecorativePath = injected.some((el) => el.type === "path" && !pathLooksTiny(el.data));
    if (!hasDecorativePath) {
        injected.push({
            id: `auto_path_${slideIndex + 1}`,
            type: "path",
            x: 92,
            y: slideIndex % 2 === 0 ? 660 : 240,
            data: "M0,48 C140,-8 300,-8 440,48 C580,104 740,104 880,48 L880,78 L0,78 Z",
            fill: toRgba(accent2, 0.22),
            opacity: 0.92,
        } as CarouselElement);
    }

    return injected.slice(0, 20);
}

function isTextElement(el: CarouselElement): el is TextElement {
    return el.type === "text";
}

function isPathElement(el: CarouselElement): el is PathElement {
    return el.type === "path";
}

function isGradientElement(el: CarouselElement): el is GradientElement {
    return el.type === "gradientRect";
}

function isGlowElement(el: CarouselElement): el is GlowElement {
    return el.type === "glow";
}

function makeSupportCopy(
    slideIndex: number,
    slideCount: number,
    creativeDirection: CreativeDirection
) {
    const isCover = slideIndex === 0;
    const isLast = slideIndex === slideCount - 1;

    if (isCover) {
        return "Sem buzzword: o que realmente funciona, onde aplicar e como transformar em resultado.";
    }

    if (isLast) {
        if (creativeDirection.cta_style === "direct" || creativeDirection.cta_style === "urgent") {
            return "Salve esse roteiro e teste por 7 dias. O que performar, você escala.";
        }
        return "Comece com um passo simples hoje e mantenha consistência até virar hábito.";
    }

    if (creativeDirection.narrative_structure === "step_by_step_cta") {
        return "Passo prático: aplique hoje e compare os resultados da próxima semana.";
    }

    if (creativeDirection.goal === "vender" || creativeDirection.goal === "captar_leads") {
        return "Transforme esse benefício em uma oferta clara, com prova e chamada para ação objetiva.";
    }

    return "Em linguagem simples: aplique esse princípio na rotina e acompanhe o impacto real.";
}

function getUniqueId(base: string, elements: CarouselElement[]) {
    const ids = new Set(elements.map((el) => el.id));
    if (!ids.has(base)) return base;

    let i = 2;
    while (ids.has(`${base}_${i}`)) i += 1;
    return `${base}_${i}`;
}

function ensureMinimumTextBlocks(
    elements: CarouselElement[],
    slideIndex: number,
    slideCount: number,
    palette: Palette,
    creativeDirection: CreativeDirection
) {
    const texts = elements.filter(isTextElement).sort((a, b) => a.y - b.y);

    if (texts.length >= 2) {
        return elements;
    }

    const backgroundFill = (() => {
        const bg = elements.find((el) => el.type === "background");
        return bg?.fill ?? palette.bg ?? "#F8FAFC";
    })();

    const hasImage = elements.some((el) => el.type === "image" || el.type === "backgroundImage");
    const fallbackTextColor = preferredTextColor(backgroundFill);
    const supportFill = ensureTextContrast(
        withAlpha(palette.text ?? fallbackTextColor, 0.78),
        backgroundFill,
        fallbackTextColor
    );

    const newElements = [...elements];
    const supportText = makeSupportCopy(slideIndex, slideCount, creativeDirection);

    if (texts.length === 0) {
        const headingId = getUniqueId(`auto_text_heading_${slideIndex + 1}`, newElements);
        const supportId = getUniqueId(`auto_text_support_${slideIndex + 1}`, newElements);

        newElements.push({
            id: headingId,
            type: "text",
            x: 84,
            y: 126,
            text: slideIndex === slideCount - 1 ? "Vamos colocar em prática?" : "Ponto principal",
            fill: ensureTextContrast(palette.text ?? fallbackTextColor, backgroundFill, fallbackTextColor),
            fontSize: 62,
            fontFamily: "Poppins",
            fontStyle: "bold",
            width: hasImage ? 520 : 860,
            align: "left",
            lineHeight: 1.12,
            letterSpacing: -0.2,
            opacity: 1,
        });

        newElements.push({
            id: supportId,
            type: "text",
            x: 84,
            y: 234,
            text: supportText,
            fill: supportFill,
            fontSize: 32,
            fontFamily: "Poppins",
            fontStyle: "normal",
            width: hasImage ? 520 : 860,
            align: "left",
            lineHeight: 1.3,
            letterSpacing: 0,
            opacity: 0.96,
        });

        return newElements;
    }

    const first = texts[0];
    const supportId = getUniqueId(`auto_text_support_${slideIndex + 1}`, newElements);
    const supportY = clamp(
        (first.y ?? 120) + Math.round((first.fontSize ?? 56) * 1.35) + 26,
        210,
        980
    );

    newElements.push({
        id: supportId,
        type: "text",
        x: first.x ?? 84,
        y: supportY,
        text: supportText,
        fill: supportFill,
        fontSize: 32,
        fontFamily: normalizeFontFamily(first.fontFamily),
        fontStyle: "normal",
        width: hasImage ? 520 : (first.width ?? 860),
        align: first.align ?? "left",
        lineHeight: 1.3,
        letterSpacing: 0,
        opacity: 0.96,
    });

    return newElements;
}

function rebalanceSlideComposition(
    elements: CarouselElement[],
    slideIndex: number,
    slideCount: number,
    palette: Palette
) {
    const isCover = slideIndex === 0;
    const isLast = slideIndex === slideCount - 1;
    const layout: "cover" | "split-right" | "split-left" | "stacked" | "cta" = isCover
        ? "cover"
        : isLast
            ? "cta"
            : slideIndex % 3 === 1
                ? "split-right"
                : slideIndex % 3 === 2
                    ? "stacked"
                    : "split-left";

    const background = elements.find((el) => el.type === "background");
    const backgroundFill = background?.fill ?? palette.bg ?? BRAND_BG;
    const fallbackText = palette.text ?? preferredTextColor(backgroundFill);

    if (background) {
        background.fill = resolveSlideBackgroundColor(palette, slideIndex);
    }

    const gradients = elements.filter(isGradientElement);
    gradients.forEach((gradient, index) => {
        gradient.kind = "linear";
        if (layout === "cover" || layout === "split-right") {
            gradient.start = { x: 0, y: 0 };
            gradient.end = { x: DOC_W, y: DOC_H };
        } else if (layout === "split-left") {
            gradient.start = { x: DOC_W, y: 0 };
            gradient.end = { x: 0, y: DOC_H };
        } else {
            gradient.start = { x: 0, y: DOC_H * 0.15 };
            gradient.end = { x: DOC_W, y: DOC_H * 0.85 };
        }
        gradient.opacity = index === 0 ? 1 : 0.45;
        gradient.stops = [0, toRgba(palette.accent ?? BRAND_ACCENT, 0.18), 1, toRgba(palette.accent2 ?? BRAND_ACCENT_2, 0.06)];
    });

    const glows = elements.filter(isGlowElement);
    glows.forEach((glow, index) => {
        const role = index % 2;
        if (layout === "cover") {
            glow.x = role === 0 ? DOC_W * 0.84 : DOC_W * 0.18;
            glow.y = role === 0 ? DOC_H * 0.2 : DOC_H * 0.88;
        } else if (layout === "split-right") {
            glow.x = DOC_W * 0.86;
            glow.y = role === 0 ? DOC_H * 0.18 : DOC_H * 0.75;
        } else if (layout === "split-left") {
            glow.x = DOC_W * 0.16;
            glow.y = role === 0 ? DOC_H * 0.2 : DOC_H * 0.78;
        } else if (layout === "stacked") {
            glow.x = role === 0 ? DOC_W * 0.84 : DOC_W * 0.26;
            glow.y = role === 0 ? DOC_H * 0.18 : DOC_H * 0.62;
        } else {
            glow.x = role === 0 ? DOC_W * 0.82 : DOC_W * 0.24;
            glow.y = role === 0 ? DOC_H * 0.62 : DOC_H * 0.84;
        }

        glow.r = clamp(glow.r ?? 260, 180, 420);
        glow.blur = clamp(glow.blur ?? 120, 70, 180);
        glow.color = role === 0 ? palette.accent ?? BRAND_ACCENT : palette.accent2 ?? BRAND_ACCENT_2;
        glow.opacity = clamp(glow.opacity ?? 0.16, 0.1, 0.22);
    });

    const texts = elements.filter(isTextElement).sort((a, b) => a.y - b.y);
    const heading = texts[0] ?? null;
    const support = texts[1] ?? null;
    const extras = texts.slice(2);

    const imageHero = elements.find((el) => el.type === "image" || el.type === "backgroundImage");
    const cards = elements.filter((el): el is Extract<CarouselElement, { type: "glassCard" }> => el.type === "glassCard");
    const primaryCard = cards[0] ?? null;
    const frameCard = cards.length > 1 ? cards[1] : null;
    const hero = imageHero ?? primaryCard;

    const leftCol = { x: 84, w: 452 };
    const rightCol = { x: 544, w: 452 };
    const fullCol = { x: 84, w: 912 };

    if (heading) {
        if (layout === "cover") {
            heading.x = fullCol.x;
            heading.y = 122;
            heading.width = 820;
            heading.fontSize = clamp(heading.fontSize ?? 78, 64, 90);
        } else if (layout === "split-right") {
            heading.x = leftCol.x;
            heading.y = 144;
            heading.width = leftCol.w;
            heading.fontSize = clamp(heading.fontSize ?? 60, 54, 72);
        } else if (layout === "split-left") {
            heading.x = rightCol.x;
            heading.y = 144;
            heading.width = rightCol.w;
            heading.fontSize = clamp(heading.fontSize ?? 60, 54, 72);
        } else if (layout === "stacked") {
            heading.x = fullCol.x;
            heading.y = 130;
            heading.width = fullCol.w;
            heading.fontSize = clamp(heading.fontSize ?? 58, 52, 70);
        } else {
            heading.x = 130;
            heading.y = 160;
            heading.width = 820;
            heading.fontSize = clamp(heading.fontSize ?? 72, 62, 86);
            heading.align = "center";
        }

        heading.fontStyle = "bold";
        heading.fontFamily = normalizeFontFamily(heading.fontFamily);
        heading.fill = ensureTextContrast(heading.fill ?? fallbackText, backgroundFill, fallbackText);
        heading.lineHeight = clamp(heading.lineHeight ?? 1.08, 1.05, 1.3);
        heading.letterSpacing = clamp(heading.letterSpacing ?? -0.3, -1, 1.5);
        heading.text = truncateText(heading.text, 130);
    }

    if (support) {
        if (layout === "cover") {
            support.x = fullCol.x;
            support.y = 290;
            support.width = 760;
        } else if (layout === "split-right") {
            support.x = leftCol.x;
            support.y = 330;
            support.width = leftCol.w;
        } else if (layout === "split-left") {
            support.x = rightCol.x;
            support.y = 330;
            support.width = rightCol.w;
        } else if (layout === "stacked") {
            support.x = fullCol.x;
            support.y = 232;
            support.width = 780;
        } else {
            support.x = 144;
            support.y = 1010;
            support.width = 792;
            support.align = "center";
        }

        support.fontSize = clamp(support.fontSize ?? 34, 30, 40);
        support.fontStyle = "normal";
        support.fontFamily = normalizeFontFamily(support.fontFamily);
        support.fill = ensureTextContrast(withAlpha(palette.text ?? fallbackText, 0.78), backgroundFill, fallbackText);
        support.lineHeight = clamp(support.lineHeight ?? 1.28, 1.15, 1.45);
        support.letterSpacing = clamp(support.letterSpacing ?? 0, -0.2, 1.2);
        support.text = truncateText(support.text, 220);
    }

    extras.forEach((extra, index) => {
        if (layout === "cta") {
            extra.x = 200;
            extra.y = 1064 + index * 38;
            extra.width = 680;
            extra.align = "center";
        } else if (layout === "split-left") {
            extra.x = rightCol.x;
            extra.y = 420 + index * 56;
            extra.width = rightCol.w;
            extra.align = "left";
        } else {
            extra.x = leftCol.x;
            extra.y = 420 + index * 56;
            extra.width = leftCol.w;
            extra.align = "left";
        }

        extra.fontSize = clamp(extra.fontSize ?? 28, 24, 34);
        extra.fontStyle = "normal";
        extra.fontFamily = normalizeFontFamily(extra.fontFamily);
        extra.fill = ensureTextContrast(withAlpha(palette.text ?? fallbackText, 0.74), backgroundFill, fallbackText);
        extra.lineHeight = clamp(extra.lineHeight ?? 1.34, 1.2, 1.5);
        extra.letterSpacing = clamp(extra.letterSpacing ?? 0, -0.2, 1.2);
        extra.text = truncateText(extra.text, 190);
    });

    if (hero) {
        if (layout === "cover") {
            hero.x = fullCol.x;
            hero.y = 700;
            hero.width = fullCol.w;
            hero.height = 430;
        } else if (layout === "split-right") {
            hero.x = rightCol.x;
            hero.y = 250;
            hero.width = rightCol.w;
            hero.height = 660;
        } else if (layout === "split-left") {
            hero.x = leftCol.x;
            hero.y = 250;
            hero.width = leftCol.w;
            hero.height = 660;
        } else if (layout === "stacked") {
            hero.x = fullCol.x;
            hero.y = 520;
            hero.width = fullCol.w;
            hero.height = 450;
        } else {
            hero.x = 180;
            hero.y = 610;
            hero.width = 720;
            hero.height = 330;
        }

        if (hero.type === "image" || hero.type === "backgroundImage") {
            hero.opacity = clamp(hero.opacity ?? 1, 0.85, 1);
            if (hero.type === "image") {
                hero.radius = clamp(hero.radius ?? hero.borderRadius ?? 30, 18, 46);
                hero.borderRadius = hero.radius;
                hero.fit = hero.fit ?? hero.cover ?? "cover";
                hero.cover = hero.fit;
            }

            if (primaryCard) {
                primaryCard.x = clamp(hero.x - 20, 64, DOC_W - 970);
                primaryCard.y = clamp(hero.y - 20, 140, DOC_H - 520);
                primaryCard.width = clamp(hero.width + 40, 360, 940);
                primaryCard.height = clamp(hero.height + 40, 260, 760);
                primaryCard.radius = 34;
                primaryCard.fill = toRgba("#ffffff", 0.34);
                primaryCard.stroke = toRgba(palette.accent ?? BRAND_ACCENT, 0.22);
                primaryCard.opacity = 0.62;
            }
        } else {
            hero.radius = clamp(hero.radius ?? 30, 20, 44);
            hero.fill = toRgba("#ffffff", 0.52);
            hero.stroke = toRgba(palette.accent ?? BRAND_ACCENT, 0.24);
            hero.opacity = clamp(hero.opacity ?? 0.75, 0.58, 0.86);
        }
    }

    if (frameCard) {
        frameCard.x = fullCol.x + 36;
        frameCard.y = layout === "cta" ? 586 : 680;
        frameCard.width = fullCol.w - 72;
        frameCard.height = layout === "cta" ? 380 : 300;
        frameCard.radius = 30;
        frameCard.fill = toRgba("#ffffff", 0.18);
        frameCard.stroke = toRgba(palette.accent2 ?? BRAND_ACCENT_2, 0.18);
        frameCard.opacity = 0.52;
    }

    const paths = elements.filter(isPathElement);
    paths.forEach((path, index) => {
        if (index === 0) {
            path.data = "M0,52 C160,0 340,0 500,52 C660,104 840,104 1000,52 L1000,86 L0,86 Z";
            path.x = 40;
            path.y = layout === "cover" ? 620 : layout === "cta" ? 520 : 980;
            path.fill = toRgba(palette.accent2 ?? BRAND_ACCENT_2, 0.28);
            path.opacity = 0.86;
            return;
        }

        path.data = "M0,30 C120,-6 260,-6 380,30 C500,66 640,66 760,30 L760,50 L0,50 Z";
        path.x = 160;
        path.y = layout === "stacked" ? 470 : 1020;
        path.fill = toRgba(palette.accent ?? BRAND_ACCENT, 0.16);
        path.opacity = 0.34;
    });

    return elements;
}

export function normalizeCarousel(
    carousel: Carousel,
    creativeDirection: CreativeDirection
): Carousel {
    const safePalette = sanitizePalette(carousel.meta.palette);
    const normalizedSlides = carousel.slides.slice(0, 6).map((slide, slideIndex) => {
        const seenIds = new Set<string>();

        const normalized = slide.elements
            .slice(0, 20)
            .filter((el) => {
                if (
                    creativeDirection.image_strategy === "none"
                    && (el.type === "image" || el.type === "backgroundImage")
                ) {
                    return false;
                }
                return true;
            })
            .map((el, index) => {
                let id = el.id?.trim() || `el_${slideIndex + 1}_${index + 1}`;
                if (seenIds.has(id)) id = `${id}_${index + 1}`;
                seenIds.add(id);

                if (el.type === "text") {
                    const isHeading = (el.fontSize ?? 0) >= 42;
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(
                            el.y < 140 && isHeading
                                ? 90 + ((slideIndex % 3) * 24)
                                : el.y,
                            0,
                            DOC_H
                        ),
                        width: el.width ? clamp(el.width, 280, DOC_W) : 800,
                        fontSize: el.fontSize ? clamp(el.fontSize, 20, 96) : 48,
                        fontFamily: normalizeFontFamily(el.fontFamily),
                        fontStyle: normalizeFontStyle(el.fontStyle, isHeading),
                        lineHeight: clamp(el.lineHeight ?? (isHeading ? 1.12 : 1.3), 1.05, 1.5),
                        letterSpacing: clamp(el.letterSpacing ?? (isHeading ? -0.2 : 0), -1, 4),
                        text: truncateText(el.text, 220),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "background") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 1, DOC_W),
                        height: clamp(el.height, 1, DOC_H),
                        fill: resolveSlideBackgroundColor(safePalette, slideIndex),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "path") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "image") {
                    const radius = el.radius ?? el.borderRadius ?? 0;
                    const sourceUrl = el.url ?? el.src;
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 40, DOC_W),
                        height: clamp(el.height, 40, DOC_H),
                        radius: clamp(radius, 0, 80),
                        ...(sourceUrl ? { url: sourceUrl, src: sourceUrl } : {}),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                        prompt: truncateText(el.prompt ?? "Imagem conceitual para o slide", 300),
                    };
                }

                if (el.type === "backgroundImage") {
                    const sourceUrl = el.url ?? el.src;
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 1, DOC_W),
                        height: clamp(el.height, 1, DOC_H),
                        ...(sourceUrl ? { url: sourceUrl, src: sourceUrl } : {}),
                        ...(el.prompt ? { prompt: truncateText(el.prompt, 300) } : {}),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "gradientRect") {
                    const rawStops = el.stops ?? [];
                    const flatStops = (Array.isArray(rawStops[0])
                        ? (rawStops as Array<[number, string]>).flat()
                        : rawStops) as Array<number | string>;
                    const kind = el.kind === "radial" ? "radial" : "linear";

                    const normalizedStops: Array<number | string> = [];
                    for (let i = 0; i + 1 < flatStops.length; i += 2) {
                        const offsetValue = flatStops[i];
                        const colorValue = flatStops[i + 1];
                        const offset = typeof offsetValue === "number" ? clamp(offsetValue, 0, 1) : 0;
                        const color = typeof colorValue === "string" ? colorValue : "rgba(255,255,255,0.12)";
                        normalizedStops.push(offset, color);
                    }

                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 1, DOC_W),
                        height: clamp(el.height, 1, DOC_H),
                        kind,
                        ...(kind === "linear"
                            ? {
                                start: el.start ?? { x: 0, y: 0 },
                                end: el.end ?? { x: DOC_W, y: DOC_H },
                            }
                            : {
                                center: el.center ?? { x: DOC_W * 0.5, y: DOC_H * 0.5 },
                                radius: clamp(el.radius ?? 640, 40, 900),
                            }),
                        stops: normalizedStops.length >= 4
                            ? normalizedStops.slice(0, 12)
                            : [0, "rgba(255,255,255,0.12)", 1, "rgba(0,0,0,0.12)"],
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "glow") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        r: clamp(el.r ?? 220, 20, 600),
                        blur: clamp(el.blur ?? 80, 0, 260),
                        opacity: el.opacity == null ? 0.25 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "glassCard") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 80, DOC_W),
                        height: clamp(el.height, 40, DOC_H),
                        radius: clamp(el.radius, 0, 80),
                        fill: el.fill ?? toRgba("#ffffff", 0.12),
                        stroke: el.stroke ?? toRgba(safePalette.accent ?? "#F77E58", 0.25),
                        opacity: el.opacity == null ? 1 : clamp(el.opacity, 0, 1),
                    };
                }

                if (el.type === "noise") {
                    return {
                        ...el,
                        id,
                        x: clamp(el.x, 0, DOC_W),
                        y: clamp(el.y, 0, DOC_H),
                        width: clamp(el.width, 1, DOC_W),
                        height: clamp(el.height, 1, DOC_H),
                        opacity: el.opacity == null ? 0.08 : clamp(el.opacity, 0, 1),
                    };
                }

                return Object.assign({}, el, { id });
            }) as CarouselElement[];

        const withBackground = ensureBackgroundElement(normalized, slideIndex, safePalette);
        const withRichness = ensureVisualRichness(
            withBackground,
            slideIndex,
            safePalette
        );
        const withTextDensity = ensureMinimumTextBlocks(
            withRichness,
            slideIndex,
            carousel.slides.length,
            safePalette,
            creativeDirection
        );
        const elements = rebalanceSlideComposition(
            withTextDensity,
            slideIndex,
            carousel.slides.length,
            safePalette
        );

        return {
            ...slide,
            id: slide.id?.trim() || `s${slideIndex + 1}`,
            elements,
        };
    });

    return {
        ...carousel,
        slides: normalizedSlides,
        meta: {
            ...carousel.meta,
            style: carousel.meta.style || creativeDirection.visual_style,
            objective: carousel.meta.objective || creativeDirection.goal,
            palette: safePalette,
        },
    };
}
