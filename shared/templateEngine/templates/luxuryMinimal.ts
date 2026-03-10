import { DOC_H, DOC_W, textOn, truncateText, withAlpha } from "../shared";
import type { CarouselElement, TemplateBuildParams } from "../types";

export function buildLuxuryMinimalTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = "#F3EEE6";
    const textColor = textOn(bg);
    const accent = palette.accent;

    const heading = truncateText(copy.heading || "Elegância no conteúdo", 72);
    const support = truncateText(copy.support || "Estrutura limpa, premium e com foco total na mensagem.", 180);

    const elements: CarouselElement[] = [
        {
            id: `bg_${slideIndex}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: bg,
            opacity: 1,
        },
        {
            id: `glow_${slideIndex}`,
            type: "glow",
            x: 220,
            y: 220,
            r: 260,
            color: accent,
            blur: 120,
            opacity: 0.2,
        },
        {
            id: `line_${slideIndex}`,
            type: "path",
            x: 72,
            y: 98,
            data: "M0,0 L936,0 L936,2 L0,2 Z",
            fill: withAlpha(textColor, 0.22),
            opacity: 1,
        },
        {
            id: `kicker_${slideIndex}`,
            type: "text",
            x: 72,
            y: 60,
            text: role === "hook" ? "LUXURY MINIMAL" : role === "cta" ? "FINALIZE" : "EDITORIAL",
            fill: withAlpha(textColor, 0.6),
            fontSize: 15,
            fontFamily: "Manrope",
            fontStyle: "bold",
            width: 500,
            align: "left",
            lineHeight: 1,
            letterSpacing: 2.6,
            opacity: 1,
        },
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: 72,
            y: 190,
            text: heading,
            fill: textColor,
            fontSize: heading.length > 28 ? 58 : 68,
            fontFamily: "Playfair Display",
            fontStyle: "bold",
            width: role === "cta" ? 900 : 520,
            align: "left",
            lineHeight: 1.08,
            letterSpacing: -0.4,
            opacity: 1,
        },
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: 72,
            y: role === "cta" ? 450 : 520,
            text: support,
            fill: withAlpha(textColor, 0.72),
            fontSize: 27,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: role === "cta" ? 820 : 500,
            align: "left",
            lineHeight: 1.42,
            letterSpacing: 0,
            opacity: 1,
        },
    ];

    if (role !== "cta") {
        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "image",
                x: 560,
                y: 170,
                width: 450,
                height: 950,
                prompt: `premium luxury portrait for: ${copy.heading || "high-end service"}. soft natural light, elegant style.`,
                fit: "cover",
                opacity: 1,
                radius: 14,
            },
            {
                id: `hero_border_${slideIndex}`,
                type: "glassCard",
                x: 548,
                y: 158,
                width: 474,
                height: 974,
                radius: 18,
                fill: "rgba(0,0,0,0)",
                stroke: withAlpha(accent, 0.45),
                strokeWidth: 1.5,
                opacity: 1,
            }
        );
    }

    copy.extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: 72,
            y: 840 + index * 54,
            text: `— ${truncateText(extra, 74)}`,
            fill: withAlpha(textColor, 0.62),
            fontSize: 22,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 480,
            align: "left",
            lineHeight: 1.3,
            letterSpacing: 0,
            opacity: 1,
        });
    });

    if (role === "cta") {
        elements.push(
            {
                id: `cta_line_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1020,
                data: "M0,0 L420,0 L420,3 L0,3 Z",
                fill: accent,
                opacity: 1,
            },
            {
                id: `cta_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1050,
                text: "SALVE ESTE POST E APLIQUE HOJE",
                fill: textColor,
                fontSize: 21,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 520,
                align: "left",
                lineHeight: 1.2,
                letterSpacing: 1.2,
                opacity: 1,
            }
        );
    }

    return elements.slice(0, 20);
}
