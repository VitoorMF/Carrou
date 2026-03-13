import { DOC_H, DOC_W, textOn, truncateText, withAlpha } from "../shared";
import type { CarouselElement, TemplateBuildParams } from "../types";

export function buildStreetwearProTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = role === "cta" ? palette.accent : "#0A0A0A";
    const mainText = textOn(bg);
    const accent = role === "cta" ? palette.accent2 : palette.accent;

    const headingText = truncateText((copy.heading || "Impacto Visual").toUpperCase(), 70);
    const supportText = truncateText(copy.support || "Conteúdo direto, com alto contraste e leitura rápida.", 170);
    const useSplitHero = role !== "cta" && (slideIndex === 0 || slideIndex === 1 || slideIndex === 2 || slideIndex === 3);
    const textOnRight = useSplitHero && slideIndex % 2 === 1;
    const textX = textOnRight ? 560 : 72;

    const supportW = textOnRight ? 430 : 360;
    const extrasW = textOnRight ? 430 : 560;
    const labelX = textOnRight ? 560 : 72;
    const splitHeroPrompt = "streetwear editorial portrait, same subject, bold contrast, dramatic lighting, urban fashion campaign, consistent framing for carousel diptych";

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
            id: `top_bar_${slideIndex}`,
            type: "path",
            x: 0,
            y: 0,
            data: `M0,0 L${DOC_W},0 L${DOC_W},18 L0,18 Z`,
            fill: accent,
            opacity: 1,
        },
        {
            id: `label_${slideIndex}`,
            type: "text",
            x: labelX,
            y: 62,
            text: role === "hook" ? "SWIPE" : role === "cta" ? "AÇÃO" : `PASSO ${slideIndex}`,
            fill: withAlpha(mainText, 0.7),
            fontSize: 16,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 360,
            align: "left",
            lineHeight: 1,
            letterSpacing: 2.2,
            opacity: 1,
        },
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: 72,
            y: 150,
            text: headingText,
            fill: mainText,
            fontSize: headingText.length > 26 ? 62 : 66,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 1000,
            align: "left",
            lineHeight: 1.1,
            letterSpacing: -1.6,
            opacity: 1,
        },
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: textX,
            y: 520,
            text: supportText,
            fill: withAlpha(mainText, 0.8),
            fontSize: 28,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: supportW,
            align: "left",
            lineHeight: 1.34,
            letterSpacing: 0,
            opacity: 1,
        },
    ];

    if (role !== "cta") {
        elements.push(
            useSplitHero
                ? {
                    id: `hero_${slideIndex}`,
                    type: "image",
                    x: slideIndex % 2 === 0 ? 540 : -540,
                    y: 320,
                    width: 1080,
                    height: 960,
                    prompt: splitHeroPrompt,
                    fit: "cover",
                    opacity: 0.92,
                }
                : {
                    id: `hero_${slideIndex}`,
                    type: "image",
                    x: 560,
                    y: 340,
                    width: 520,
                    height: 920,
                    prompt: `streetwear editorial portrait for: ${copy.heading || "modern creator"}. bold contrast, dramatic lighting.`,
                    fit: "cover",
                    opacity: 0.9,
                },
            useSplitHero
                ? {
                    id: `hero_fade_${slideIndex}`,
                    type: "gradientRect",
                    x: slideIndex % 2 === 0 ? 380 : 460,
                    y: 320,
                    width: 240,
                    height: 960,
                    kind: "linear",
                    start: { x: 0, y: 0 },
                    end: { x: 240, y: 0 },
                    stops: slideIndex % 2 === 0
                        ? [0, bg, 1, "rgba(10,10,10,0)"]
                        : [0, "rgba(10,10,10,0)", 1, bg],
                    opacity: 1,
                }
                : {
                    id: `hero_fade_${slideIndex}`,
                    type: "gradientRect",
                    x: 420,
                    y: 340,
                    width: 240,
                    height: 920,
                    kind: "linear",
                    start: { x: 0, y: 0 },
                    end: { x: 240, y: 0 },
                    stops: [0, bg, 1, "rgba(10,10,10,0)"],
                    opacity: 1,
                }
        );
    }

    copy.extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: textX,
            y: 800 + index * 56,
            text: `• ${truncateText(extra, 64)}`,
            fill: withAlpha(mainText, 0.72),
            fontSize: 22,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: extrasW,
            align: "left",
            lineHeight: 1.28,
            letterSpacing: 0,
            opacity: 1,
        });
    });

    if (role === "cta") {
        elements.push(
            {
                id: `cta_block_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1060,
                data: "M0,0 L450,0 L450,84 L0,84 Z",
                fill: "#0A0A0A",
                opacity: 1,
            },
            {
                id: `cta_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1083,
                text: "SALVA E ENVIA PRA ALGUÉM →",
                fill: "#FFFFFF",
                fontSize: 22,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 450,
                align: "center",
                lineHeight: 1.2,
                letterSpacing: 1.5,
                opacity: 1,
            }
        );
    }

    return elements.slice(0, 20);
}
