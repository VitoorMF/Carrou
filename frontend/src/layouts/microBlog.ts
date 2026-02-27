import type { Carousel } from "../types/caroussel";

type Theme = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};

function pickTheme(seed = "paper"): Theme {
    const themes: Theme[] = [
        // Paper Yellow
        { bg: "#F7F2E8", text: "#111111", muted: "#3A3A3A", accent: "#FFD54A", accent2: "#111111" },
        // Dark Neon
        { bg: "#0B0B0D", text: "#F5F5F5", muted: "#B8B8B8", accent: "#C6FF00", accent2: "#F5F5F5" },
        // White Minimal
        { bg: "#FFFFFF", text: "#111111", muted: "#4B4B4B", accent: "#FFE066", accent2: "#111111" },
    ];
    return seed === "dark" ? themes[1] : seed === "white" ? themes[2] : themes[0];
}

function clearGenerated(elements: any[]) {
    return (elements ?? []).filter((e) => e?.kind !== "generated");
}

function ensureCanvas(slide: any, theme: Theme) {
    slide.canvas = slide.canvas ?? {};
    slide.canvas.background = { type: "solid", value: theme.bg };
    slide.canvas.elements = Array.isArray(slide.canvas.elements) ? slide.canvas.elements : [];
    slide.canvas.elements = clearGenerated(slide.canvas.elements);
}

function push(elArr: any[], el: any) {
    elArr.push({ ...el, kind: "generated" });
}

function ensureProfileCard(slide: any, theme: Theme) {
    const existing = (slide.canvas?.elements ?? []).find((e: any) => e?.type === "profileCard");
    if (existing) return existing;

    const author = {
        name: slide?.meta?.authorName ?? "Username",
        role: slide?.meta?.authorRole ?? "Creator",
        avatarSrc: slide?.meta?.authorAvatar ?? "",
    };

    // Microblog: pequeno no topo esquerdo (bem discreto)
    const el = {
        id: "profile",
        type: "profileCard",
        kind: "generated",
        variant: "minimal",
        x: 72,
        y: 56,
        w: 360,
        h: 72,
        user: author,
        accent: "transparent",
        text: theme.text,
        opacity: 1,
        selectable: true,
        draggable: true,
    };

    slide.canvas.elements.push(el);
    return el;
}

function slideNumber(index: number, total: number) {
    const a = String(index + 1).padStart(2, "0");
    const b = String(total).padStart(2, "0");
    return `${a}/${b}`;
}

/**
 * Heurística simples:
 * destaca 1 linha (ou 1 frase curta) do body/bullets como “highlight”
 * Você pode trocar isso por IA depois.
 */
function pickHighlightText(slide: any) {
    const txt = (slide.body ?? "").trim();
    if (!txt) return "";
    const firstLine = txt.split("\n").map((s: string) => s.trim()).filter(Boolean)[0] ?? "";
    // se muito longa, corta
    return firstLine.length > 42 ? firstLine.slice(0, 42).trim() + "…" : firstLine;
}

function compileMicroblogCover(slide: any, theme: Theme, index: number, total: number) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    // contador topo direito
    push(els, {
        id: "counter",
        type: "text",
        x: 1080 - 72 - 200,
        y: 70,
        w: 200,
        text: slideNumber(index, total),
        fontSize: 22,
        fontWeight: 600,
        align: "right",
        color: theme.muted,
    });

    // headline MUITO grande, tipo tweet
    push(els, {
        id: "headline",
        type: "text",
        x: 72,
        y: 200,
        w: 936,
        text: slide.headline ?? "",
        fontSize: 86,
        lineHeight: 1.05,
        fontWeight: 900,
        align: "left",
        color: theme.text,
    });

    // linha fina “underline” decorativa
    push(els, {
        id: "underline",
        type: "shape",
        name: "line",
        x: 72,
        y: 520,
        w: 320,
        h: 6,
        color: theme.accent,
        opacity: 1,
        radius: 6,
    });

    // subtítulo curto
    push(els, {
        id: "body",
        type: "text",
        x: 72,
        y: 560,
        w: 860,
        text: slide.body ?? "",
        fontSize: 34,
        lineHeight: 1.35,
        fontWeight: 500,
        align: "left",
        color: theme.muted,
    });
}

function compileMicroblogContent(slide: any, theme: Theme, index: number, total: number) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    // contador
    push(els, {
        id: "counter",
        type: "text",
        x: 1080 - 72 - 200,
        y: 70,
        w: 200,
        text: slideNumber(index, total),
        fontSize: 22,
        fontWeight: 600,
        align: "right",
        color: theme.muted,
    });

    // headline menor
    push(els, {
        id: "headline",
        type: "text",
        x: 72,
        y: 170,
        w: 936,
        text: slide.headline ?? "",
        fontSize: 56,
        lineHeight: 1.15,
        fontWeight: 900,
        align: "left",
        color: theme.text,
    });

    // highlight (tarja) com 1 frase forte
    const hi = pickHighlightText(slide);
    if (hi) {
        // tarja
        push(els, {
            id: "highlight_bg",
            type: "shape",
            name: "highlight",
            x: 72,
            y: 300,
            w: 936,
            h: 84,
            color: theme.accent,
            opacity: 1,
            radius: 16,
        });

        // texto da tarja
        push(els, {
            id: "highlight_text",
            type: "text",
            x: 92,
            y: 320,
            w: 896,
            text: hi,
            fontSize: 34,
            lineHeight: 1.2,
            fontWeight: 900,
            align: "left",
            color: theme.accent2,
        });
    }

    // corpo principal (pode ser body + bullets)
    const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice(0, 5) : [];
    const body = (slide.body ?? "").trim();

    const contentText =
        bullets.length
            ? bullets.map((b: string) => `— ${b}`).join("\n")
            : body;

    push(els, {
        id: "content",
        type: "text",
        x: 72,
        y: hi ? 420 : 320,
        w: 936,
        text: contentText,
        fontSize: 34,
        lineHeight: 1.55,
        fontWeight: 520,
        align: "left",
        color: theme.text,
    });
}

function compileMicroblogCTA(slide: any, theme: Theme, index: number, total: number) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    push(els, {
        id: "counter",
        type: "text",
        x: 1080 - 72 - 200,
        y: 70,
        w: 200,
        text: slideNumber(index, total),
        fontSize: 22,
        fontWeight: 600,
        align: "right",
        color: theme.muted,
    });

    push(els, {
        id: "headline",
        type: "text",
        x: 72,
        y: 220,
        w: 936,
        text: slide.headline ?? "Se isso te ajudou…",
        fontSize: 72,
        lineHeight: 1.1,
        fontWeight: 900,
        align: "left",
        color: theme.text,
    });

    // CTA “botão” é só uma tarja + texto (microblog)
    push(els, {
        id: "cta_bg",
        type: "shape",
        name: "pill",
        x: 72,
        y: 520,
        w: 760,
        h: 92,
        color: theme.accent,
        opacity: 1,
        radius: 999,
    });

    push(els, {
        id: "cta_text",
        type: "text",
        x: 110,
        y: 546,
        w: 700,
        text: slide.body ?? "Salva e manda pra alguém que precisa ler isso.",
        fontSize: 30,
        lineHeight: 1.2,
        fontWeight: 900,
        align: "left",
        color: theme.accent2,
    });

    const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3) : [];
    if (bullets.length) {
        push(els, {
            id: "bullets",
            type: "text",
            x: 72,
            y: 680,
            w: 936,
            text: bullets.map((b: string) => `✓ ${b}`).join("\n"),
            fontSize: 30,
            lineHeight: 1.5,
            fontWeight: 650,
            align: "left",
            color: theme.text,
        });
    }
}

export function microblogBold(input: Carousel): Carousel {
    const theme = pickTheme(input?.meta?.style ?? "paper");
    const total = input.slides.length;

    const next: Carousel = {
        ...input,
        slides: input.slides.map((s: any, idx: number) => {
            const slide = { ...s, canvas: { ...(s.canvas ?? {}), elements: [...(s.canvas?.elements ?? [])] } };

            if (slide.role === "cover") compileMicroblogCover(slide, theme, idx, total);
            else if (slide.role === "cta") compileMicroblogCTA(slide, theme, idx, total);
            else compileMicroblogContent(slide, theme, idx, total);

            slide.background = { type: "solid", value: theme.bg };
            return slide;
        }),
    };

    return next;
}