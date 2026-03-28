import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

function buildCreatorPrompt(heading: string) {
    return [
        `realistic workspace photography about ${heading || "content creation and education"}`,
        "bright natural light",
        "clean minimal workspace or teaching environment",
        "warm neutral tones, white and beige surfaces",
        "high contrast, editorial style",
        "vertical composition 4:5",
        "space for text overlay",
        "modern professional aesthetic",
        "not a poster, not a magazine cover, not a flyer",
        "no text, no typography, no letters, no words, no logo, no watermark, no caption",
        "no headline printed in the scene",
    ].join(", ");
}

function isLightHex(hex: string): boolean {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return true;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 128;
}

export function buildMicroBlogBoldTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;
    const imageLayout = slideIndex % 2 === 0;

    const surface = palette.bg;
    const textPrimary = palette.text;
    const textMuted = palette.muted;
    const accent = palette.accent;
    const accent2 = palette.accent2;

    const photoText = "#FFFFFF";
    const slideNum = String(slideIndex + 1).padStart(2, "0");
    const heading = truncateText(copy.heading || "Você pensa no que vai dizer", imageLayout ? 74 : 80);
    const support = truncateText(
        copy.support || "Design não é só estética. É sobre comunicar com clareza, intenção e consistência visual.",
        imageLayout ? 160 : 220
    );
    const signature = "MARIANA REIS  |  DESIGNER  •  DESIGN COM PROPÓSITO";

    const elements: CarouselElement[] = [
        {
            id: `bg_${slideIndex}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: imageLayout ? "#000000" : role === "cta" ? accent2 : surface,
            opacity: 1,
        },
    ];

    if (imageLayout) {
        // Image slides: photo full-bleed with light top bar + text at bottom
        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "backgroundImage",
                x: 0,
                y: 0,
                width: DOC_W,
                height: DOC_H,
                prompt: buildCreatorPrompt(copy.heading),
                fit: "cover",
                opacity: 1,
            },
            // Dark gradient at bottom for text legibility
            {
                id: `overlay_bottom_${slideIndex}`,
                type: "gradientRect",
                x: 0,
                y: 600,
                width: DOC_W,
                height: DOC_H - 600,
                kind: "linear",
                start: { x: 0, y: 0 },
                end: { x: 0, y: DOC_H - 600 },
                stops: [
                    0, "rgba(0,0,0,0)",
                    0.25, "rgba(0,0,0,0.55)",
                    0.6, "rgba(0,0,0,0.82)",
                    1, "rgba(0,0,0,0.92)",
                ],
                opacity: 1,
            },
            // White top bar
            {
                id: `top_bar_${slideIndex}`,
                type: "path",
                x: 0,
                y: 0,
                data: `M0,0 L${DOC_W},0 L${DOC_W},110 L0,110 Z`,
                fill: "#FFFFFF",
                opacity: 0.94,
            },
            // Brand/mode tag
            {
                id: `mode_tag_${slideIndex}`,
                type: "text",
                x: 72,
                y: 52,
                text: role === "hook" ? "ABERTURA" : role === "cta" ? "VIRADA" : `PONTO ${slideIndex}`,
                fill: accent,
                fontSize: 16,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 300,
                align: "left",
                lineHeight: 1,
                letterSpacing: 2,
                opacity: 1,
            },
            // Slide number top right
            {
                id: `slide_num_${slideIndex}`,
                type: "text",
                x: DOC_W - 160,
                y: 40,
                text: slideNum,
                fill: accent,
                fontSize: 32,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 100,
                align: "right",
                lineHeight: 1,
                letterSpacing: 1,
                opacity: 0.9,
            },
            // Orange accent bar above heading
            {
                id: `accent_bar_${slideIndex}`,
                type: "path",
                x: 72,
                y: role === "hook" ? 720 : 580,
                data: `M0,0 L160,0 L160,6 L0,6 Z`,
                fill: accent,
                opacity: 1,
            },
            // Heading
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 72,
                y: role === "hook" ? 740 : 600,
                text: heading,
                fill: photoText,
                fontSize: role === "hook" ? 58 : 52,
                fontFamily: "Montserrat",
                fontStyle: "bold",
                width: 700,
                align: "left",
                lineHeight: 1.02,
                letterSpacing: -0.5,
                opacity: 1,
            },
            // Support text
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 72,
                y: role === "hook" ? 1020 : 880,
                text: support,
                fill: withAlpha(photoText, 0.84),
                fontSize: 28,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 640,
                align: "left",
                lineHeight: 1.28,
                letterSpacing: 0,
                opacity: 1,
            }
        );
    } else {
        // Content slides: clean white with left accent bar
        const ctaText = role === "cta" ? (isLightHex(accent2) ? "#111111" : "#FFFFFF") : textPrimary;
        const ctaMuted = role === "cta" ? withAlpha(ctaText, 0.68) : textMuted;

        elements.push(
            // Left accent bar
            {
                id: `accent_left_${slideIndex}`,
                type: "path",
                x: 0,
                y: 0,
                data: `M0,0 L8,0 L8,${DOC_H} L0,${DOC_H} Z`,
                fill: accent,
                opacity: 1,
            },
            // Mode tag (top left)
            {
                id: `mode_tag_${slideIndex}`,
                type: "text",
                x: 72,
                y: 52,
                text: role === "hook" ? "ABERTURA" : role === "cta" ? "VIRADA" : `PONTO ${slideIndex}`,
                fill: accent,
                fontSize: 15,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 260,
                align: "left",
                lineHeight: 1,
                letterSpacing: 2.2,
                opacity: 1,
            },
            // Slide number top right
            {
                id: `slide_num_${slideIndex}`,
                type: "text",
                x: DOC_W - 160,
                y: 40,
                text: slideNum,
                fill: ctaText,
                fontSize: 32,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 100,
                align: "right",
                lineHeight: 1,
                letterSpacing: 1,
                opacity: 0.22,
            },
            // Heading
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 72,
                y: role === "cta" ? 280 : 320,
                text: heading,
                fill: ctaText,
                fontSize: role === "cta" ? 68 : 62,
                fontFamily: "Montserrat",
                fontStyle: "bold",
                width: 650,
                align: "left",
                lineHeight: 1.04,
                letterSpacing: -0.4,
                opacity: 1,
            },
            // Support text
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 72,
                y: role === "cta" ? 720 : 760,
                text: support,
                fill: ctaMuted,
                fontSize: 30,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 580,
                align: "left",
                lineHeight: 1.34,
                letterSpacing: 0,
                opacity: 1,
            }
        );
    }

    copy.extras.slice(0, imageLayout ? 2 : 4).forEach((extra, index) => {
        const numLabel = String(index + 1).padStart(2, "0");
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: 72,
            y: imageLayout ? 1130 + index * 50 : 980 + index * 54,
            text: imageLayout
                ? truncateText(extra, 60)
                : `${numLabel}. ${truncateText(extra, 52)}`,
            fill: imageLayout
                ? withAlpha(photoText, 0.82)
                : withAlpha(palette.text, role === "cta" ? 0.9 : 0.88),
            fontSize: imageLayout ? 24 : 26,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: imageLayout ? 640 : 560,
            align: "left",
            lineHeight: 1.18,
            letterSpacing: 0,
            opacity: 1,
        });
    });

    elements.push(
        {
            id: `signature_${slideIndex}`,
            type: "text",
            x: 72,
            y: 1294,
            text: signature,
            fill: imageLayout ? withAlpha(photoText, 0.56) : withAlpha(textMuted, 0.68),
            fontSize: 11,
            fontFamily: "Sora",
            fontStyle: "normal",
            width: 940,
            align: "left",
            lineHeight: 1,
            letterSpacing: 2.2,
            opacity: 1,
        }
    );

    return elements.slice(0, 20);
}

