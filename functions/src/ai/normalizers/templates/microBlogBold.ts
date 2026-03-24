import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

function buildEditorialPrompt(heading: string) {
    return [
        `realistic editorial photography about ${heading || "design communication"}`,
        "neutral warm tones",
        "fashion/art direction",
        "cinematic natural light",
        "high-end instagram visual",
        "vertical composition 4:5",
        "space for text overlay",
        "clean photographic background",
        "not a poster, not a magazine cover, not a flyer",
        "no text, no typography, no letters, no words, no logo, no watermark, no caption",
        "no headline printed in the scene",
    ].join(", ");
}

export function buildMicroBlogBoldTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;
    const imageLayout = slideIndex % 2 === 0;

    const surface = palette.bg;
    const textPrimary = palette.text;
    const textMuted = palette.muted;
    const accent = palette.accent;
    const accent2 = palette.accent2;
    const heading = truncateText(copy.heading || "Você pensa no que vai dizer", imageLayout ? 74 : 80);
    const support = truncateText(
        copy.support || "Design não é só estética. É sobre comunicar com clareza, intenção e consistência visual.",
        imageLayout ? 170 : 220
    );
    const signature = "USER  •  ROLE";

    const elements: CarouselElement[] = [
        {
            id: `bg_${slideIndex}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: imageLayout ? surface : role === "cta" ? accent2 : surface,
            opacity: 1,
        },
    ];

    if (imageLayout) {
        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "backgroundImage",
                x: 0,
                y: 0,
                width: DOC_W,
                height: DOC_H,
                prompt: buildEditorialPrompt(copy.heading),
                fit: "cover",
                opacity: 1,
            },
            {
                id: `overlay_${slideIndex}`,
                type: "gradientRect",
                x: 0,
                y: 0,
                width: DOC_W,
                height: DOC_H,
                kind: "linear",
                start: { x: 0, y: 0 },
                end: { x: 0, y: DOC_H },
                stops: [
                    0, withAlpha(surface, 0.62),
                    0.32, withAlpha(surface, 0.46),
                    0.58, withAlpha(surface, 0.26),
                    0.8, withAlpha(surface, 0.08),
                    1, withAlpha(surface, 0),
                ],
                opacity: 1,
            },
            {
                id: `overlay_text_zone_${slideIndex}`,
                type: "gradientRect",
                x: 0,
                y: 0,
                width: 820,
                height: DOC_H,
                kind: "linear",
                start: { x: 0, y: 0 },
                end: { x: 820, y: 0 },
                stops: [
                    0, withAlpha(surface, 0.62),
                    0.32, withAlpha(surface, 0.46),
                    0.58, withAlpha(surface, 0.26),
                    0.8, withAlpha(surface, 0.08),
                    1, withAlpha(surface, 0),
                ],
                opacity: 1,
            },
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 84,
                y: role === "hook" ? 770 : 630,
                text: heading,
                fill: textPrimary,
                fontSize: role === "hook" ? 52 : 48,
                fontFamily: "Montserrat",
                fontStyle: "normal",
                width: 660,
                align: "left",
                lineHeight: 1.05,
                letterSpacing: -0.4,
                opacity: 1,
            },
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 84,
                y: role === "hook" ? 1010 : 860,
                text: support,
                fill: withAlpha(textPrimary, 0.9),
                fontSize: 29,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 600,
                align: "left",
                lineHeight: 1.24,
                letterSpacing: 0,
                opacity: 1,
            }
        );
    } else {
        elements.push(
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 250,
                y: role === "cta" ? 300 : 340,
                text: heading,
                fill: textPrimary,
                fontSize: role === "cta" ? 64 : 60,
                fontFamily: "Montserrat",
                fontStyle: "normal",
                width: 600,
                align: "left",
                lineHeight: 1.08,
                letterSpacing: -0.3,
                opacity: 1,
            },
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 270,
                y: role === "cta" ? 700 : 760,
                text: support,
                fill: withAlpha(textMuted, 0.86),
                fontSize: 30,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 540,
                align: "left",
                lineHeight: 1.32,
                letterSpacing: 0,
                opacity: 1,
            }
        );
    }

    copy.extras.slice(0, imageLayout ? 2 : 4).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: imageLayout ? 84 : 270,
            y: imageLayout ? 1120 + index * 46 : 960 + index * 50,
            text: imageLayout
                ? truncateText(extra, 62)
                : `✓ ${truncateText(extra, 52)}`,
            fill: imageLayout ? withAlpha(textPrimary, 0.84) : withAlpha(textPrimary, 0.92),
            fontSize: imageLayout ? 24 : 26,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: imageLayout ? 620 : 520,
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
            x: 84,
            y: 1288,
            text: signature,
            fill: imageLayout ? withAlpha(textPrimary, 0.6) : withAlpha(textMuted, 0.72),
            fontSize: 11,
            fontFamily: "Sora",
            fontStyle: "normal",
            width: 920,
            align: "left",
            lineHeight: 1,
            letterSpacing: 2.2,
            opacity: 1,
        },
        {
            id: `mode_tag_${slideIndex}`,
            type: "text",
            x: 84,
            y: 78,
            text: role === "hook" ? "ABERTURA" : role === "cta" ? "VIRADA" : `PONTO ${slideIndex}`,
            fill: imageLayout ? withAlpha(textPrimary, 0.86) : withAlpha(textMuted, 0.72),
            fontSize: 15,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 260,
            align: "left",
            lineHeight: 1,
            letterSpacing: 1.4,
            opacity: 1,
        }
    );

    if (!imageLayout) {
        elements.push({
            id: `accent_line_${slideIndex}`,
            type: "text",
            x: 250,
            y: role === "cta" ? 268 : 308,
            text: "DESIGN",
            fill: accent,
            fontSize: 22,
            fontFamily: "Montserrat",
            fontStyle: "bold",
            width: 180,
            align: "left",
            lineHeight: 1,
            letterSpacing: 0.6,
            opacity: 1,
        });
    }

    return elements.slice(0, 20);
}
