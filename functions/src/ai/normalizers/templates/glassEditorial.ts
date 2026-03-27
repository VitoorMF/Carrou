import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    truncateText,
    withAlpha,
    ResolvedPalette,
    type CarouselElement,
} from "../shared";


const PANEL_X = 96;
const PANEL_W = 888;
const PANEL_RADIUS = 32;
const PANEL_PADDING_X = 64;
const PANEL_PADDING_Y = 56;
const CHROME_H = 65;
const FOOTER_H = 104;

function buildGlassEditorialPrompt(heading: string, support: string) {
    return [
        `documentary editorial photo about ${heading || support || "current affairs"}`,
        "cinematic photography",
        "natural texture and atmosphere",
        "serious magazine mood",
        "strong composition with negative space",
        "no text, no typography, no watermark, no collage, no UI baked into image",
    ].join(", ");
}

function buildBaseElements(slideIndex: number, heading: string, support: string, palette: ResolvedPalette): CarouselElement[] {
    return [
        {
            id: `bg_${slideIndex}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: palette.bg,
            opacity: 1,
        },
        {
            id: `hero_${slideIndex}`,
            type: "backgroundImage",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            prompt: buildGlassEditorialPrompt(heading, support),
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
            stops: [0, withAlpha(palette.bg, 0.08), 0.55, withAlpha(palette.bg, 0.16), 1, withAlpha(palette.bg, 0.34)],
            opacity: 1,
        },
    ];
}

function buildPanel(slideIndex: number, y: number, height: number, palette: ResolvedPalette): CarouselElement {
    return {
        id: `panel_${slideIndex}`,
        type: "glassCard",
        x: PANEL_X,
        y,
        width: PANEL_W,
        height,
        radius: PANEL_RADIUS,
        fill: withAlpha(palette.bg, 0.8),
        stroke: withAlpha(palette.text, 0.12),
        strokeWidth: 1,
        shadow: { blur: 20, y: 12, opacity: 0.18 },
        opacity: 1,
    };
}

function buildChromeDots(slideIndex: number, x: number, y: number, palette: ResolvedPalette): CarouselElement[] {
    return [0, 1, 2].map((index) => ({
        id: `chrome_dot_${slideIndex}_${index}`,
        type: "shape",
        name: "circle",
        x: x + index * 28,
        y,
        w: 18,
        h: 18,
        color: withAlpha(palette.text, 0.86),
        opacity: 1,
    }));
}

function buildChromeBar(slideIndex: number, panelY: number, palette: ResolvedPalette): CarouselElement[] {
    const x = PANEL_X;
    const y = panelY;
    const w = PANEL_W;

    return [
        {
            id: `chrome_bar_${slideIndex}`,
            type: "glassCard",
            x,
            y,
            width: w,
            height: CHROME_H,
            radius: 14,
            fill: withAlpha(palette.bg, 0.92),
            stroke: withAlpha(palette.text, 0.08),
            strokeWidth: 1,
            shadow: { blur: 10, y: 3, opacity: 0.12 },
            opacity: 1,
        },
        ...buildChromeDots(slideIndex, x + 22, y + 22, palette),
    ];
}

function buildFooter(
    slideIndex: number,
    panelY: number,
    panelH: number,
    label: string,
    palette: ResolvedPalette,
    stronger = false
): CarouselElement[] {
    const lineY = panelY + panelH - FOOTER_H;
    const footerY = lineY + 1;
    const footerColor = withAlpha(palette.text, 0.07);

    if (stronger) {
        const iconSize = 24;
        const gap = 84;
        const totalWidth = iconSize * 3 + gap * 2;
        const baseX = PANEL_X + (PANEL_W - totalWidth) / 2;
        const iconY = footerY + 40;

        return [
            {
                id: `footer_line_${slideIndex}`,
                type: "path",
                x: PANEL_X,
                y: lineY,
                data: `M0,0 L${PANEL_W},0 L${PANEL_W},1 L0,1 Z`,
                fill: withAlpha(palette.text, 0.48),
                opacity: 1,
            },
            {
                id: `footer_bg_${slideIndex}`,
                type: "path",
                x: PANEL_X,
                y: footerY,
                data: `M0,0
                    L${PANEL_W},0
                    L${PANEL_W},${FOOTER_H - PANEL_RADIUS}
                    Q${PANEL_W},${FOOTER_H} ${PANEL_W - PANEL_RADIUS},${FOOTER_H}
                    L${PANEL_RADIUS},${FOOTER_H}
                    Q0,${FOOTER_H} 0,${FOOTER_H - PANEL_RADIUS}
                    Z`,
                fill: footerColor,
                opacity: 1,
            },
            {
                id: `footer_path_like_${slideIndex}`,
                type: "path",
                x: baseX,
                y: iconY,
                data: "M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z",
                fill: palette.accent,
                opacity: 1,
            },
            {
                id: `footer_path_save_${slideIndex}`,
                type: "path",
                x: baseX + iconSize + gap,
                y: iconY,
                data: "M2.849,23.55a2.954,2.954,0,0,0,3.266-.644L12,17.053l5.885,5.853a2.956,2.956,0,0,0,2.1.881,3.05,3.05,0,0,0,1.17-.237A2.953,2.953,0,0,0,23,20.779V5a5.006,5.006,0,0,0-5-5H6A5.006,5.006,0,0,0,1,5V20.779A2.953,2.953,0,0,0,2.849,23.55Z",
                fill: palette.accent,
                opacity: 1,
            },
            {
                id: `footer_path_follow_${slideIndex}`,
                type: "path",
                x: baseX + (iconSize + gap) * 2,
                y: iconY,
                data: "M5.878 9.356c-2.133-2.156-2.114-5.634 0.042-7.767C6.956 0.567 8.348 0 9.797 0h0.028C12.834-0.005 15.281 2.433 15.286 5.447v0.047c0.023 3.009-2.395 5.475-5.409 5.498H9.797c-1.472 0-2.883-0.586-3.919-1.636zM18.802 22.58c-0.68 0.844-1.716 1.336-2.92 1.383-0.708 0.028-1.467 0.042-2.386 0.042-0.628 0-1.27-0.005-1.884-0.009-0.469-0.005-0.947-0.009-1.425-0.009v0.009h-0.45c-0.577 0-1.153 0-1.73 0.005s-1.153 0.005-1.73 0.005c-0.811 0-1.486-0.005-2.114-0.009-1.5-0.019-2.681-0.52-3.408-1.453s-0.933-2.203-0.586-3.666c0.483-2.039 1.72-3.905 3.488-5.25 1.758-1.341 3.923-2.077 6.094-2.077 0.094 0 0.188 0 0.277 0.005 4.734 0.136 8.738 3.436 9.52 7.852 0.206 1.186-0.056 2.316-0.745 3.173zM19.809 12.867c-0.82 0-1.491-0.666-1.491-1.491V10.172H17.109c-0.82-0.014-1.477-0.694-1.462-1.514 0.014-0.802 0.661-1.448 1.462-1.462h1.209v-1.209c0.014-0.82 0.694-1.477 1.514-1.462 0.802 0.014 1.448 0.661 1.462 1.462v1.209h1.209c0.82-0.014 1.5 0.642 1.514 1.462s-0.642 1.5-1.462 1.514H21.295v1.209c0.005 0.82-0.661 1.486-1.486 1.486z",
                fill: palette.accent,
                opacity: 1,
            },
        ];
    }

    return [
        {
            id: `footer_line_${slideIndex}`,
            type: "path",
            x: PANEL_X,
            y: lineY,
            data: `M0,0 L${PANEL_W},0 L${PANEL_W},1 L0,1 Z`,
            fill: withAlpha(palette.text, 0.48),
            opacity: 1,
        },
        {
            id: `footer_bg_${slideIndex}`,
            type: "path",
            x: PANEL_X,
            y: footerY,
            data: `M0,0
                L${PANEL_W},0
                L${PANEL_W},${FOOTER_H - PANEL_RADIUS}
                Q${PANEL_W},${FOOTER_H} ${PANEL_W - PANEL_RADIUS},${FOOTER_H}
                L${PANEL_RADIUS},${FOOTER_H}
                Q0,${FOOTER_H} 0,${FOOTER_H - PANEL_RADIUS}
                Z`,
            fill: footerColor,
            opacity: 1,
        },
        {
            id: `footer_text_${slideIndex}`,
            type: "text",
            x: PANEL_X + 30,
            y: footerY + (stronger ? 30 : 34),
            text: label,
            fill: palette.text,
            fontSize: stronger ? 24 : 22,
            fontFamily: "Manrope",
            fontStyle: stronger ? "bold" : "normal",
            width: PANEL_W - 128,
            align: "left",
            lineHeight: 1.18,
            letterSpacing: 0,
            opacity: 1,
        },
        {
            id: `footer_arrow_${slideIndex}`,
            type: "text",
            x: PANEL_X + PANEL_W - 98,
            y: footerY + 28,
            text: "→",
            fill: palette.text,
            fontSize: 42,
            fontFamily: "Sora",
            fontStyle: "normal",
            width: 56,
            align: "center",
            lineHeight: 1,
            letterSpacing: 0,
            opacity: 1,
        },
    ];
}

function buildCoverElements(
    slideIndex: number,
    heading: string,
    palette: ResolvedPalette
): CarouselElement[] {
    const panelY = 392;
    const panelH = 574;
    const contentTop = panelY + PANEL_PADDING_Y + CHROME_H - 30;

    return [
        buildPanel(slideIndex, panelY, panelH, palette),
        {
            id: `cover_glow_${slideIndex}`,
            type: "glow",
            x: PANEL_X + PANEL_W * 0.55,
            y: panelY + 162,
            r: 132,
            color: palette.accent,
            blur: 96,
            opacity: 0.08,
        },
        {
            id: `cover_kicker_${slideIndex}`,
            type: "text",
            x: PANEL_X + PANEL_PADDING_X,
            y: contentTop,
            text: "VAMOS CONVERSAR",
            fill: withAlpha(palette.text, 0.92),
            fontSize: 18,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 300,
            align: "left",
            lineHeight: 1,
            letterSpacing: 1.2,
            opacity: 1,
        },
        {
            id: `cover_heading_${slideIndex}`,
            type: "text",
            x: PANEL_X + PANEL_PADDING_X,
            y: contentTop + 74,
            text: heading,
            fill: palette.text,
            fontSize: 72,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 690,
            align: "left",
            lineHeight: 1.05,
            letterSpacing: -1.2,
            opacity: 1,
        },
        ...buildFooter(slideIndex, panelY, panelH, "Arraste para continuar", palette),
    ];
}

function buildBodyElements(
    slideIndex: number,
    role: TemplateBuildParams["role"],
    heading: string,
    support: string,
    extras: string[],
    palette: ResolvedPalette
): CarouselElement[] {
    const panelY = role === "cta" ? 332 : 315;
    const panelH = role === "cta" ? 648 : 736;
    const contentTop = role === "cta" ? panelY + PANEL_PADDING_Y + CHROME_H + 8 : panelY + PANEL_PADDING_Y + CHROME_H - 30;
    const elements: CarouselElement[] = [
        buildPanel(slideIndex, panelY, panelH, palette),
        ...buildChromeBar(slideIndex, panelY, palette),
    ];

    if (role === "cta") {
        elements.push(
            {
                id: `cta_heading_${slideIndex}`,
                type: "text",
                x: PANEL_X + PANEL_PADDING_X,
                y: contentTop + 10,
                text: heading,
                fill: palette.text,
                fontSize: 64,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 680,
                align: "left",
                lineHeight: 1.06,
                letterSpacing: -1,
                opacity: 1,
            },
            {
                id: `cta_support_${slideIndex}`,
                type: "text",
                x: PANEL_X + PANEL_PADDING_X,
                y: contentTop + 202,
                text: support,
                fill: withAlpha(palette.text, 0.88),
                fontSize: 28,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 650,
                align: "left",
                lineHeight: 1.44,
                letterSpacing: 0,
                opacity: 1,
            },
            ...buildFooter(slideIndex, panelY, panelH, "Salve e compartilhe este debate", palette, true)
        );

        return elements;
    }

    elements.push(
        {
            id: `content_heading_${slideIndex}`,
            type: "text",
            x: PANEL_X + PANEL_PADDING_X,
            y: contentTop + 18,
            text: heading,
            fill: palette.text,
            fontSize: 64,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 680,
            align: "left",
            lineHeight: 1.08,
            letterSpacing: -1,
            opacity: 1,
        },
        {
            id: `content_support_${slideIndex}`,
            type: "text",
            x: PANEL_X + PANEL_PADDING_X,
            y: contentTop + 198,
            text: support,
            fill: withAlpha(palette.text, 0.9),
            fontSize: 28,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 656,
            align: "left",
            lineHeight: 1.46,
            letterSpacing: 0,
            opacity: 1,
        }
    );

    extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `content_extra_${slideIndex}_${index}`,
            type: "text",
            x: PANEL_X + PANEL_PADDING_X,
            y: contentTop + 402 + index * 58,
            text: `• ${truncateText(extra, 68)}`,
            fill: withAlpha(palette.muted, 0.96),
            fontSize: 23,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 620,
            align: "left",
            lineHeight: 1.34,
            letterSpacing: 0,
            opacity: 1,
        });
    });

    elements.push(...buildFooter(slideIndex, panelY, panelH, "Proximo ponto", palette));

    return elements;
}

export function buildGlassEditorialTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;
    const heading = truncateText(copy.heading || "Glass Editorial", role === "hook" ? 58 : 74);
    const support = truncateText(
        copy.support || "Narrativa visual com fotografia forte, painel escuro e leitura editorial limpa.",
        role === "hook" ? 150 : 250
    );

    const elements: CarouselElement[] = [
        ...buildBaseElements(slideIndex, heading, support, palette),
    ];

    if (role === "hook") {
        elements.push(...buildCoverElements(slideIndex, heading, palette));
        return elements.slice(0, 20);
    }

    elements.push(
        ...buildBodyElements(
            slideIndex,
            role,
            heading,
            support,
            copy.extras,
            palette
        )
    );

    return elements.slice(0, 20);
}
