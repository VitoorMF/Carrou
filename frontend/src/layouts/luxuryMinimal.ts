
import type { Carousel } from "../types/caroussel";

type Theme = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};

function pickTheme(seed = "luxury"): Theme {
    const themes: Theme[] = [
        {
            bg: "#F5F1ED",     // bege editorial
            text: "#2E2A28",   // marrom quase preto
            muted: "#8B817A",  // taupe suave
            accent: "#B89C8A", // bege mais escuro
            accent2: "#6E5E55" // marrom profundo
        },
    ];
    return themes[0];
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


function findImageEl(slide: any) {
    return (slide.canvas?.elements ?? []).find((e: any) => e?.type === "image") ?? null;
}

function ensureImage(slide: any, theme: Theme) {
    // se o LLM já colocou a image element, ótimo — só preenche prompt se estiver vazio
    const img = findImageEl(slide);

    const basePrompt = slide.headline
        ? `3D cartoon-style object representing ${slide.headline},
            modern 3D illustration,
            smooth rounded shapes,
            realistic but stylized materials,
            true-to-life object colors,
            medium saturation,
            vivid but balanced color palette,
            neutral studio lighting (not soft editorial),
            clean but colorful,
            no text,
            transparent background,
            avoid white-only objects,
            avoid beige and pastel tones,
            avoid washed-out or muted colors
            `
        : "";

    if (img) {
        if (!img.prompt && basePrompt) img.prompt = basePrompt;
        return img;
    }

    // fallback: cria uma placeholder com prompt guiado pelo tema
    const created = {
        id: "img",
        type: "image",
        prompt: basePrompt,
        bg: "transparent",
        fit: "contain",
        opacity: 1,
        kind: "complement",
    };
    slide.canvas.elements.push(created);
    return created;
}

function ensureProfileCard(slide: any, theme: Theme) {
    // se já tem, não duplica
    const existing = (slide.canvas?.elements ?? []).find((e: any) => e?.type === "profileCard");
    if (existing) return existing;

    const author = {
        name: slide?.meta?.authorName ?? "Username",
        role: slide?.meta?.authorRole ?? "Cargo/função na empresa",
        avatarSrc: slide?.meta?.authorAvatar ?? "",
    };

    // cover: neutro em baixo
    if (slide.role === "cover") {
        const el = {
            id: "profile",
            type: "profileCard",
            kind: "generated",
            variant: "neutral",
            x: 30,
            y: 1350 - 112, // margem
            w: 350,
            h: 92,
            user: author,
            accent: "#ffffff05", // sem accent pra cover
            text: theme.accent2,
            opacity: 1,
            selectable: true,
            draggable: true,
        };
        slide.canvas.elements.push(el);
        return el;
    }

    // content: filled no topo
    if (slide.role === "content") {
        const el = {
            id: "profile",
            type: "profileCard",
            kind: "generated",
            variant: "neutral",
            x: 1080 / 2 - 175,
            y: 56,
            w: 350,
            h: 96,
            user: author,
            accent: theme.bg,
            text: theme.accent2,
            opacity: 1,
            selectable: true,
            draggable: true,
        };
        slide.canvas.elements.push(el);
        return el;
    }

    // cta: neutro em baixo-centro
    const el = {
        id: "profile",
        type: "profileCard",
        kind: "generated",
        variant: "neutral",
        x: 1080 / 2 - 175,

        y: 1350 - 112, // margem
        w: 350,
        h: 92,
        user: author,
        accent: theme.bg,
        text: theme.accent2,

        opacity: 1,
        selectable: true,
        draggable: true,
    };
    slide.canvas.elements.push(el);
    return el;
}


function push(elArr: any[], el: any) {
    elArr.push({ ...el, kind: "generated" });
}

function compileCover(slide: any, theme: Theme) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    // TAG pequena acima
    push(els, {
        id: "tag",
        type: "text",
        x: 96,
        y: 160,
        w: 400,
        text: slide.meta?.tag ?? "BRANDING",
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 2,
        align: "left",
        color: theme.muted,
    });

    // HEADLINE serif grande
    push(els, {
        id: "headline",
        type: "text",
        x: 96,
        y: 220,
        w: 400,
        text: slide.headline ?? "",
        fontSize: 65,
        lineHeight: 1.1,
        fontWeight: 800,
        align: "left",
        fontFamily: "Playfair Display",
        color: theme.text,
    });

    // Subtítulo
    push(els, {
        id: "body",
        type: "text",
        x: 96,
        y: 520,
        w: 400,
        text: slide.body ?? "",
        fontSize: 32,
        lineHeight: 1.4,
        fontWeight: 400,
        align: "left",
        color: theme.muted,
    });


    // Linha fina decorativa
    push(els, {
        id: "divider",
        type: "shape",
        name: "line",
        x: 1080 / 2 - 460,
        y: 1350 - 150,
        w: 920,
        h: 5,
        color: theme.accent,
        opacity: 1,
    });


    // image (garante existir)
    const img = ensureImage(slide, theme);
    Object.assign(img, {
        x: 0,
        y: 0,
        w: 1080,
        h: 1350,
        fit: "contain",
        bg: "transparent",
        opacity: 1,
        kind: "complement",
    });
}

function compileContent(slide: any, theme: Theme, index: number) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    // número minimalista
    push(els, {
        id: "index",
        type: "text",
        x: 96,
        y: 160,
        w: 200,
        text: `0${index + 1}`,
        fontSize: 48,
        fontWeight: 300,
        align: "left",
        color: theme.accent,
    });

    // título serif
    push(els, {
        id: "headline",
        type: "text",
        x: 96,
        y: 240,
        w: 880,
        text: slide.headline ?? "",
        fontSize: 64,
        lineHeight: 1.2,
        fontWeight: 600,
        fontFamily: "Playfair Display",
        align: "left",
        color: theme.text,
    });

    // corpo editorial
    push(els, {
        id: "body",
        type: "text",
        x: 96,
        y: 380,
        w: 820,
        text: slide.body ?? "",
        fontSize: 30,
        lineHeight: 1.6,
        fontWeight: 400,
        align: "left",
        color: theme.muted,
    });
}

function compileCTA(slide: any, theme: Theme) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    ensureProfileCard(slide, theme);

    push(els, {
        id: "headline",
        type: "text",
        x: 96,
        y: 300,
        w: 880,
        text: slide.headline ?? "",
        fontSize: 72,
        fontWeight: 600,
        fontFamily: "Playfair Display",
        align: "left",
        color: theme.text,
    });

    push(els, {
        id: "body",
        type: "text",
        x: 96,
        y: 460,
        w: 800,
        text: slide.body ?? "",
        fontSize: 32,
        lineHeight: 1.5,
        fontWeight: 400,
        align: "left",
        color: theme.muted,
    });

    // CTA sublinhado elegante
    push(els, {
        id: "cta",
        type: "text",
        x: 96,
        y: 700,
        w: 500,
        text: "Salve este post para rever depois",
        fontSize: 28,
        fontWeight: 500,
        align: "left",
        color: theme.accent2,
        underline: true,
    });
}

export function luxuryMinimal(input: Carousel): Carousel {
    const theme = pickTheme(input?.meta?.style ?? "clean");

    const next: Carousel = {
        ...input,
        slides: input.slides.map((s: any, idx: number) => {
            const slide = { ...s, canvas: { ...(s.canvas ?? {}), elements: [...(s.canvas?.elements ?? [])] } };

            // aplica por role
            if (slide.role === "cover") compileCover(slide, theme);
            else if (slide.role === "cta") compileCTA(slide, theme);
            else compileContent(slide, theme, idx);

            // Ensure renderer-friendly top-level background exists.
            // Some parts of the app (eg. EditPage) read `slide.background` while
            // the layout generators populate `canvas.background`. Copy it through
            // so the slide always has a background the renderer can use.
            slide.background = { type: "solid", value: theme.bg };

            return slide;
        }),
    };

    return next;
}
