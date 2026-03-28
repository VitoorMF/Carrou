import { DOC_H, DOC_W, textOn, truncateText, withAlpha } from "../shared";
import type { CarouselElement, TemplateBuildParams } from "../types";

function circlePath(r: number): string {
    const k = r * 0.5523;
    return `M${-r},0 C${-r},${-k} ${-k},${-r} 0,${-r} C${k},${-r} ${r},${-k} ${r},0 C${r},${k} ${k},${r} 0,${r} C${-k},${r} ${-r},${k} ${-r},0 Z`;
}

function buildWaveCluster(cx: number, cy: number): string {
    const lineCount = 22;
    const w = 1120;
    const h = 500;
    const amplitude = 34;
    const frequency = 2.6;
    const rotDeg = -32;
    const rotRad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const lineSpacing = h / (lineCount - 1);
    const segCount = 10;
    const ribbonH = 2.2;

    const rot = (px: number, py: number): [number, number] => [
        cx + (px - cx) * cos - (py - cy) * sin,
        cy + (px - cx) * sin + (py - cy) * cos,
    ];

    const paths: string[] = [];

    for (let i = 0; i < lineCount; i++) {
        const baseY = cy - h / 2 + i * lineSpacing;
        const phase = i * 0.3;
        const topPts: [number, number][] = [];
        const botPts: [number, number][] = [];

        for (let j = 0; j <= segCount; j++) {
            const px = (cx - w / 2) + (j / segCount) * w;
            const wave = amplitude * Math.sin((j / segCount) * frequency * 2 * Math.PI + phase);
            topPts.push(rot(px, baseY + wave));
            botPts.push(rot(px, baseY + wave + ribbonH));
        }

        const [x0, y0] = topPts[0];
        let d = `M${Math.round(x0)},${Math.round(y0)}`;
        for (let j = 1; j <= segCount; j++) {
            const [x, y] = topPts[j];
            d += ` L${Math.round(x)},${Math.round(y)}`;
        }
        for (let j = segCount; j >= 0; j--) {
            const [x, y] = botPts[j];
            d += ` L${Math.round(x)},${Math.round(y)}`;
        }
        d += " Z";
        paths.push(d);
    }

    return paths.join(" ");
}

// Top-left cluster + bottom-right cluster
const WAVE_PATH =
    buildWaveCluster(DOC_W * 0.6, DOC_H * 0.14);

export function buildStreetwearProTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = role === "cta" ? palette.accent : palette.bg;
    const mainText = textOn(bg);
    const accent = role === "cta" ? palette.accent2 : palette.accent;

    const headingText = truncateText((copy.heading || "Impacto Visual").toUpperCase(), 60);
    const supportText = truncateText(copy.support || "Conteúdo direto, com alto contraste e leitura rápida.", 170);
    const useSplitHero = role !== "cta" && (slideIndex === 0 || slideIndex === 1 || slideIndex === 2 || slideIndex === 3);
    const textOnRight = useSplitHero && slideIndex % 2 === 1;
    const textX = textOnRight ? 560 : 72;

    const supportW = textOnRight ? 430 : 420;
    const extrasW = textOnRight ? 430 : 500;
    const splitHeroPrompt = "streetwear editorial portrait, same subject, bold contrast, dramatic lighting, urban fashion campaign, consistent framing for carousel diptych";
    const slideNum = String(slideIndex);

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
        // Wave texture — decorative background element
        {
            id: `wave_${slideIndex}`,
            type: "path",
            x: -350,
            y: -200,
            data: WAVE_PATH,
            fill: withAlpha(mainText, 0.09),
            opacity: 1,
        },

        // Wave texture — decorative background element
        {
            id: `wave2_${slideIndex}`,
            type: "path",
            x: 100,
            y: 1250,
            data: WAVE_PATH,
            fill: withAlpha(mainText, 0.09),
            opacity: 1,
        },




        // Decorative ring — top-right corner, partially off-screen
        {
            id: `deco_circle_outer_${slideIndex}`,
            type: "path",
            x: DOC_W + 100,
            y: -130,
            data: circlePath(310),
            fill: accent,
            opacity: 1,
        },
        {
            id: `deco_circle_inner_${slideIndex}`,
            type: "path",
            x: DOC_W + 100,
            y: -130,
            data: circlePath(240),
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
        // Heading — constrained to left half for stacked typographic impact
        {
            id: `heading_${slideIndex}`,
            type: "text",
            x: textX,
            y: 340,
            text: headingText,
            fill: mainText,
            fontSize: headingText.length > 22 ? 66 : 76,
            fontFamily: "Sora",
            fontStyle: "bold",
            width: 500,
            align: "left",
            lineHeight: 1.06,
            letterSpacing: -1.8,
            opacity: 1,
        },
        {
            id: `support_${slideIndex}`,
            type: "text",
            x: textX,
            y: 760,
            text: supportText,
            fill: withAlpha(mainText, 0.8),
            fontSize: 27,
            fontFamily: "Manrope",
            fontStyle: "normal",
            width: supportW,
            align: "left",
            lineHeight: 1.36,
            letterSpacing: 0,
            opacity: 1,
        },
    ];

    if (slideIndex !== 0 && role !== "cta") {
        elements.push(
            // Giant decorative slide number — bottom-left, very faint

            {
                id: `deco_num_${slideIndex}`,
                type: "text",
                x: 30,
                y: 10,
                text: slideNum,
                fill: mainText,
                fontSize: 360,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 700,
                align: "left",
                lineHeight: 1,
                letterSpacing: -10,
                opacity: 0.07,
            },

        );
    }

    if (role !== "cta") {
        elements.push(
            useSplitHero
                ? {
                    id: `hero_pair_${Math.floor(slideIndex / 2)}`,
                    type: "image",
                    x: slideIndex % 2 === 0 ? 540 + 54 : -540 + 54,
                    y: 320,
                    width: 1080 - 108,
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
                        ? [0, bg, 1, withAlpha(bg, 0)]
                        : [0, withAlpha(bg, 0), 1, bg],
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
                    stops: [0, bg, 1, withAlpha(bg, 0)],
                    opacity: 1,
                }
        );
    }

    copy.extras.slice(0, 2).forEach((extra, index) => {
        elements.push({
            id: `extra_${slideIndex}_${index}`,
            type: "text",
            x: textX,
            y: 1020 + index * 56,
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
        // Icon row — like / save / follow
        // 3 boxes of 80px with 24px gap, starting at x:72
        // Centers: 112, 216, 320
        const ICON_Y = 900;
        const LABEL_Y = 948;
        const ICON_FILL = withAlpha(mainText, 0.88);
        elements.push(
            // Heart (like) — 40×37, center at x:112
            {
                id: `icon_like_${slideIndex}`,
                type: "path",
                x: 92,
                y: ICON_Y,
                data: "M20,35 C20,35 2,22 2,12 C2,6.5 6.5,2 12,2 C15.5,2 18.5,4.5 20,8 C21.5,4.5 24.5,2 28,2 C33.5,2 38,6.5 38,12 C38,22 20,35 20,35 Z",
                fill: ICON_FILL,
                opacity: 1,
            },
            {
                id: `icon_like_label_${slideIndex}`,
                type: "text",
                x: 72,
                y: LABEL_Y,
                text: "CURTIR",
                fill: withAlpha(mainText, 0.55),
                fontSize: 13,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 80,
                align: "center",
                lineHeight: 1,
                letterSpacing: 1.6,
                opacity: 1,
            },
            // Bookmark (save) — 32×40, center at x:216
            {
                id: `icon_save_${slideIndex}`,
                type: "path",
                x: 200,
                y: ICON_Y,
                data: "M2,2 L30,2 L30,38 L16,29 L2,38 Z",
                fill: ICON_FILL,
                opacity: 1,
            },
            {
                id: `icon_save_label_${slideIndex}`,
                type: "text",
                x: 176,
                y: LABEL_Y,
                text: "SALVAR",
                fill: withAlpha(mainText, 0.55),
                fontSize: 13,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 80,
                align: "center",
                lineHeight: 1,
                letterSpacing: 1.6,
                opacity: 1,
            },
            // Person + plus (follow) — combined path, center at x:320
            {
                id: `icon_follow_${slideIndex}`,
                type: "path",
                x: 300,
                y: ICON_Y,
                data: "M14,0 L26,0 L26,14 L40,14 L40,26 L26,26 L26,40 L14,40 L14,26 L0,26 L0,14 L14,14 Z",
                fill: ICON_FILL,
                opacity: 1,
            },
            {
                id: `icon_follow_label_${slideIndex}`,
                type: "text",
                x: 280,
                y: LABEL_Y,
                text: "SEGUIR",
                fill: withAlpha(mainText, 0.55),
                fontSize: 13,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 80,
                align: "center",
                lineHeight: 1,
                letterSpacing: 1.6,
                opacity: 1,
            },
            // CTA button
            {
                id: `cta_block_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1060,
                data: "M0,0 L450,0 L450,84 L0,84 Z",
                fill: palette.bg,
                opacity: 1,
            },
            {
                id: `cta_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1083,
                text: "SALVA E ENVIA PRA ALGUÉM →",
                fill: palette.text,
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
    } else {
        elements.push(
            {
                id: `swipe_block_${slideIndex}`,
                type: "path",
                x: 72,
                y: 1220,
                data: "M0,0 L380,0 L380,72 L0,72 Z",
                fill: accent,
                opacity: 1,
            },
            {
                id: `swipe_text_${slideIndex}`,
                type: "text",
                x: 72,
                y: 1243,
                text: "ARRASTE PARA O LADO  →",
                fill: textOn(accent),
                fontSize: 20,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 380,
                align: "center",
                lineHeight: 1.2,
                letterSpacing: 1.8,
                opacity: 1,
            }
        );
    }

    return elements.slice(0, 20);
}
