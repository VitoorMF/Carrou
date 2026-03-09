import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    textOn,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

export function buildEditorial3DTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = "#EFF8F8";
    const textColor = "#0F172A";
    const accent = palette.accent;

    const heading = truncateText(copy.heading || "Editorial 3D", 74);
    const support = truncateText(copy.support || "Layout com profundidade visual para chamar atenção sem perder legibilidade.", 185);

    const imageOnRight = slideIndex % 2 === 0;
    const heroX = imageOnRight ? 500 : 0;
    const heroW = 580;

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
            id: `arrows_${slideIndex}`,
            type: "glow",
            x: imageOnRight ? 860 : 220,
            y: 220,
            r: 260,
            color: accent,
            blur: 120,
            opacity: 0.2,
        } as CarouselElement,
        {
            id: `decor_bar_${slideIndex}`,
            type: "path",
            x: imageOnRight ? 0 : DOC_W - 22,
            y: 0,
            data: `M0,0 L22,0 L22,${DOC_H} L0,${DOC_H} Z`,
            fill: withAlpha(accent, 0.75),
            opacity: 1,
        } as CarouselElement,
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: 72,
            y: 150,
            text: heading,
            fill: textColor,
            fontSize: heading.length > 30 ? 58 : 66,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 560,
            align: "left",
            lineHeight: 1.04,
            letterSpacing: -1,
            opacity: 1,
        } as CarouselElement,
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: 72,
            y: 450,
            text: support,
            fill: withAlpha(textColor, 0.74),
            fontSize: 28,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 520,
            align: "left",
            lineHeight: 1.36,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement,
    ];

    if (role !== "cta") {
        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "image",
                x: heroX,
                y: 340,
                width: heroW,
                height: 910,
                prompt: `3D editorial object for: ${copy.heading || "creative topic"}. studio lighting, smooth material, vibrant but clean.`,
                fit: "contain",
                opacity: 1,
            } as CarouselElement,
            {
                id: `hero_fade_${slideIndex}`,
                type: "gradientRect",
                x: imageOnRight ? heroX - 180 : heroX + heroW - 60,
                y: 340,
                width: 240,
                height: 910,
                kind: "linear",
                start: { x: 0, y: 0 },
                end: { x: 240, y: 0 },
                stops: imageOnRight
                    ? [0, bg, 1, "rgba(239,248,248,0)"]
                    : [0, "rgba(239,248,248,0)", 1, bg],
                opacity: 1,
            } as CarouselElement
        );
    }

    copy.extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: 72,
            y: 760 + index * 58,
            text: `• ${truncateText(extra, 72)}`,
            fill: withAlpha(textColor, 0.7),
            fontSize: 23,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 520,
            align: "left",
            lineHeight: 1.28,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement);
    });

    if (role === "cta") {
        elements.push(
            {
                id: `cta_bg_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1100,
                data: "M0,0 L520,0 L520,90 L0,90 Z",
                fill: accent,
                opacity: 1,
            } as CarouselElement,
            {
                id: `cta_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1126,
                text: "SALVE E TESTE AINDA HOJE",
                fill: textOn(accent),
                fontSize: 23,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 520,
                align: "center",
                lineHeight: 1.2,
                letterSpacing: 1.3,
                opacity: 1,
            } as CarouselElement
        );
    }

    return elements.slice(0, 20);
}
