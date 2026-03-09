import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    textOn,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

export function buildStreetwearProTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = role === "cta" ? palette.accent : "#0A0A0A";
    const mainText = textOn(bg);
    const accent = role === "cta" ? palette.accent2 : palette.accent;

    const headingText = truncateText((copy.heading || "Impacto Visual").toUpperCase(), 70);
    const supportText = truncateText(copy.support || "Conteúdo direto, com alto contraste e leitura rápida.", 170);

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
        } as CarouselElement,
        {
            id: `top_bar_${slideIndex}`,
            type: "path",
            x: 0,
            y: 0,
            data: `M0,0 L${DOC_W},0 L${DOC_W},18 L0,18 Z`,
            fill: accent,
            opacity: 1,
        } as CarouselElement,
        {
            id: `label_${slideIndex}`,
            type: "text",
            x: 72,
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
        } as CarouselElement,
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: 72,
            y: 150,
            text: headingText,
            fill: mainText,
            fontSize: headingText.length > 26 ? 62 : 76,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 620,
            align: "left",
            lineHeight: 0.96,
            letterSpacing: -1.6,
            opacity: 1,
        } as CarouselElement,
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: 72,
            y: 520,
            text: supportText,
            fill: withAlpha(mainText, 0.8),
            fontSize: 28,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 620,
            align: "left",
            lineHeight: 1.34,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement,
    ];

    if (role !== "cta") {
        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "image",
                x: 560,
                y: 340,
                width: 520,
                height: 920,
                prompt: `streetwear editorial portrait for: ${copy.heading || "modern creator"}. bold contrast, dramatic lighting.`,
                fit: "cover",
                opacity: 0.9,
            } as CarouselElement,
            {
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
            } as CarouselElement
        );
    }

    copy.extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: 72,
            y: 800 + index * 56,
            text: `• ${truncateText(extra, 64)}`,
            fill: withAlpha(mainText, 0.72),
            fontSize: 22,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 560,
            align: "left",
            lineHeight: 1.28,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement);
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
            } as CarouselElement,
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
            } as CarouselElement
        );
    }

    return elements.slice(0, 20);
}
