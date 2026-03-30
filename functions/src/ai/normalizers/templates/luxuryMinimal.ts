import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    truncateText,
    withAlpha,
    type CarouselElement,
} from "../shared";

/*
 * Luxury Minimal — Editorial 2026
 *
 * Conceito: quiet luxury, espaço respira, tipografia serifada dominante.
 * Cover: foto full-bleed + overlay sutil + headline na parte inferior.
 * Content: fundo sólido (cream), texto generoso, sem imagem.
 * CTA: fundo sólido, headline centralizada, instrução mínima.
 *
 * Zero glows. Zero gradients decorativos. Zero bordas.
 * Margens: 120px (luxo real = espaço vazio).
 */

const MARGIN = 120;
const CONTENT_W = DOC_W - MARGIN * 2; // 840

function buildEditorialPrompt(heading: string) {
    return [
        `luxury editorial photograph for: ${heading || "premium lifestyle"}`,
        "environmental portrait or still life",
        "desaturated warm tones, matte finish",
        "soft natural light with atmosphere",
        "shadows slightly lifted, not crushed",
        "high-end magazine editorial quality",
        "negative space for text overlay",
        "no text, no typography, no watermark, no logo",
    ].join(", ");
}

function buildCover(slideIndex: number, copy: TemplateBuildParams["copy"], palette: TemplateBuildParams["palette"]): CarouselElement[] {
    const heading = truncateText(copy.heading || "Elegância no conteúdo", 64);
    const support = truncateText(copy.support || "", 140);

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
            prompt: buildEditorialPrompt(copy.heading),
            promptContext: `${buildEditorialPrompt(copy.heading)} | Content: ${copy.heading}. ${copy.support}`,
            fit: "cover",
            opacity: 1,
        },
        // Overlay: sutil escurecimento na parte inferior para legibilidade
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
                0, "rgba(0,0,0,0)",
                0.45, "rgba(0,0,0,0)",
                0.75, "rgba(0,0,0,0.18)",
                1, "rgba(0,0,0,0.52)",
            ],
            opacity: 1,
        },
        // Label pequeno no topo
        {
            id: `kicker_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 72,
            text: "EDITORIAL",
            fill: "rgba(255,255,255,0.72)",
            fontSize: 13,
            fontFamily: "Manrope",
            fontStyle: "bold",
            width: 300,
            align: "left",
            lineHeight: 1,
            letterSpacing: 3.5,
            opacity: 1,
        },
        // Linha accent curta no topo
        {
            id: `accent_line_${slideIndex}`,
            type: "path",
            x: MARGIN,
            y: 100,
            data: "M0,0 L56,0 L56,1.5 L0,1.5 Z",
            fill: palette.accent,
            opacity: 0.8,
        },
        // Headline serifada grande na parte inferior
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 1020,
            text: heading,
            fill: "#FAFAF8",
            fontSize: heading.length > 36 ? 48 : 56,
            fontFamily: "Playfair Display",
            fontStyle: "bold",
            width: CONTENT_W,
            align: "left",
            lineHeight: 1.1,
            letterSpacing: -0.5,
            opacity: 1,
        },
        // Support sob o headline
        ...(support ? [{
            id: `support_${slideIndex}`,
            type: "text" as const,
            x: MARGIN,
            y: 1200,
            text: support,
            fill: "rgba(255,255,255,0.68)",
            fontSize: 22,
            fontFamily: "Manrope",
            fontStyle: "normal" as const,
            width: 620,
            align: "left" as const,
            lineHeight: 1.4,
            letterSpacing: 0,
            opacity: 1,
        }] : []),
    ];
}

function buildContent(slideIndex: number, copy: TemplateBuildParams["copy"], palette: TemplateBuildParams["palette"]): CarouselElement[] {
    const heading = truncateText(copy.heading || "Ponto importante", 80);
    const support = truncateText(copy.support || "", 260);
    const stepLabel = String(slideIndex).padStart(2, "0");

    const elements: CarouselElement[] = [
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
        // Número do passo — discreto no topo
        {
            id: `step_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 100,
            text: stepLabel,
            fill: withAlpha(palette.muted, 0.5),
            fontSize: 13,
            fontFamily: "Manrope",
            fontStyle: "bold",
            width: 100,
            align: "left",
            lineHeight: 1,
            letterSpacing: 3,
            opacity: 1,
        },
        // Linha accent curta sob o step
        {
            id: `accent_line_${slideIndex}`,
            type: "path",
            x: MARGIN,
            y: 128,
            data: "M0,0 L48,0 L48,1.5 L0,1.5 Z",
            fill: palette.accent,
            opacity: 0.7,
        },
        // Headline serifada — grande, com respiro
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 240,
            text: heading,
            fill: palette.text,
            fontSize: heading.length > 40 ? 42 : 48,
            fontFamily: "Playfair Display",
            fontStyle: "bold",
            width: CONTENT_W,
            align: "left",
            lineHeight: 1.12,
            letterSpacing: -0.3,
            opacity: 1,
        },
        // Separador fino — respira entre headline e body
        {
            id: `separator_${slideIndex}`,
            type: "path",
            x: MARGIN,
            y: 480,
            data: `M0,0 L${CONTENT_W},0 L${CONTENT_W},1 L0,1 Z`,
            fill: withAlpha(palette.muted, 0.2),
            opacity: 1,
        },
        // Body em sans-serif
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 520,
            text: support,
            fill: withAlpha(palette.text, 0.65),
            fontSize: 26,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 700,
            align: "left",
            lineHeight: 1.48,
            letterSpacing: 0,
            opacity: 1,
        },
    ];

    // Extras com traço elegante
    copy.extras.slice(0, 4).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: MARGIN,
            y: 740 + index * 58,
            text: `—  ${truncateText(extra, 70)}`,
            fill: withAlpha(palette.text, 0.48),
            fontSize: 24,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: 700,
            align: "left",
            lineHeight: 1.3,
            letterSpacing: 0,
            opacity: 1,
        });
    });

    // Âncora no rodapé
    elements.push(
        {
            id: `bottom_rule_${slideIndex}`,
            type: "path",
            x: MARGIN,
            y: 1240,
            data: `M0,0 L${CONTENT_W},0 L${CONTENT_W},1 L0,1 Z`,
            fill: withAlpha(palette.muted, 0.12),
            opacity: 1,
        },
        {
            id: `page_num_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 1268,
            text: stepLabel,
            fill: withAlpha(palette.muted, 0.3),
            fontSize: 13,
            fontFamily: "Manrope",
            fontStyle: "bold",
            width: CONTENT_W,
            align: "right",
            lineHeight: 1,
            letterSpacing: 2,
            opacity: 1,
        }
    );

    return elements;
}

function buildCta(slideIndex: number, copy: TemplateBuildParams["copy"], palette: TemplateBuildParams["palette"]): CarouselElement[] {
    const heading = truncateText(copy.heading || "Próximo passo", 64);
    const support = truncateText(copy.support || "", 120);

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
        // Linha accent centralizada acima do headline
        {
            id: `accent_line_${slideIndex}`,
            type: "path",
            x: DOC_W / 2 - 32,
            y: 480,
            data: "M0,0 L64,0 L64,1.5 L0,1.5 Z",
            fill: palette.accent,
            opacity: 0.8,
        },
        // Headline serifada centralizada — máximo impacto
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 530,
            text: heading,
            fill: palette.text,
            fontSize: heading.length > 30 ? 48 : 56,
            fontFamily: "Playfair Display",
            fontStyle: "bold",
            width: CONTENT_W,
            align: "center",
            lineHeight: 1.1,
            letterSpacing: -0.4,
            opacity: 1,
        },
        // Separador fino centralizado
        {
            id: `separator_${slideIndex}`,
            type: "path",
            x: DOC_W / 2 - 24,
            y: 740,
            data: "M0,0 L48,0 L48,1 L0,1 Z",
            fill: withAlpha(palette.muted, 0.35),
            opacity: 1,
        },
        // CTA text — instrução simples em small caps
        {
            id: `cta_text_${slideIndex}`,
            type: "text",
            x: MARGIN,
            y: 776,
            text: support.toUpperCase() || "SALVE E COMPARTILHE",
            fill: withAlpha(palette.text, 0.5),
            fontSize: 16,
            fontFamily: "Manrope",
            fontStyle: "bold",
            width: CONTENT_W,
            align: "center",
            lineHeight: 1.6,
            letterSpacing: 3,
            opacity: 1,
        },
    ];
}

export function buildLuxuryMinimalTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    if (role === "hook") {
        return buildCover(slideIndex, copy, palette);
    }

    if (role === "cta") {
        return buildCta(slideIndex, copy, palette);
    }

    return buildContent(slideIndex, copy, palette);
}
