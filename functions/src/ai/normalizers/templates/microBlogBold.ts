import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    textOn,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

export function buildMicroBlogBoldTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = slideIndex % 2 === 0 ? "#FFFFFF" : "#F6F8FF";
    const textColor = textOn(bg);
    const accent = palette.accent;

    const heading = truncateText(copy.heading || "Post Direto ao Ponto", 78);
    const support = truncateText(copy.support || "Microblog com leitura rápida e foco total em clareza.", 190);

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
            id: `accent_tag_${slideIndex}`,
            type: "path",
            x: 72,
            y: 72,
            data: "M0,0 L250,0 L250,46 L0,46 Z",
            fill: accent,
            opacity: 1,
        } as CarouselElement,
        {
            id: `accent_tag_text_${slideIndex}`,
            type: "text",
            x: 72,
            y: 85,
            text: role === "hook" ? "LEIA ISSO" : role === "cta" ? "CALL TO ACTION" : `SLIDE ${slideIndex + 1}`,
            fill: textOn(accent),
            fontSize: 16,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 250,
            align: "center",
            lineHeight: 1.2,
            letterSpacing: 1.4,
            opacity: 1,
        } as CarouselElement,
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: 72,
            y: 170,
            text: heading,
            fill: textColor,
            fontSize: heading.length > 34 ? 56 : 66,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 920,
            align: "left",
            lineHeight: 1.02,
            letterSpacing: -1,
            opacity: 1,
        } as CarouselElement,
        {
            id: `support_card_${slideIndex}`,
            type: "glassCard",
            x: 72,
            y: 430,
            width: 936,
            height: 220,
            radius: 26,
            fill: withAlpha(textColor, 0.06),
            stroke: withAlpha(textColor, 0.15),
            strokeWidth: 1.5,
            opacity: 1,
        } as CarouselElement,
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: 108,
            y: 476,
            text: support,
            fill: withAlpha(textColor, 0.82),
            fontSize: 31,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 860,
            align: "left",
            lineHeight: 1.34,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement,
    ];

    copy.extras.slice(0, 3).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: 92,
            y: 720 + index * 62,
            text: `✓ ${truncateText(extra, 84)}`,
            fill: withAlpha(textColor, 0.76),
            fontSize: 26,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 860,
            align: "left",
            lineHeight: 1.2,
            letterSpacing: 0,
            opacity: 1,
        } as CarouselElement);
    });

    if (role !== "cta") {
        elements.push({
            id: `footer_${slideIndex}`,
            type: "text",
            x: 72,
            y: 1220,
            text: role === "hook" ? "Deslize para os próximos" : "Continue →",
            fill: withAlpha(textColor, 0.54),
            fontSize: 18,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 500,
            align: "left",
            lineHeight: 1.1,
            letterSpacing: 1.5,
            opacity: 1,
        } as CarouselElement);
    }

    if (role === "cta") {
        elements.push(
            {
                id: `cta_block_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1120,
                data: "M0,0 L600,0 L600,92 L0,92 Z",
                fill: accent,
                opacity: 1,
            } as CarouselElement,
            {
                id: `cta_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1148,
                text: "SALVA AGORA E ME SEGUE PRA MAIS",
                fill: textOn(accent),
                fontSize: 24,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 600,
                align: "center",
                lineHeight: 1.2,
                letterSpacing: 1.3,
                opacity: 1,
            } as CarouselElement
        );
    }

    return elements.slice(0, 20);
}
