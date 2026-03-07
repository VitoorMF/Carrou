
import type { Carousel } from "../types/caroussel";

type Theme = {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accent2: string;
};

function pickTheme(seed = "clean"): Theme {
    const themes: Theme[] = [
        { bg: "#EFF8F8", text: "#393939", muted: "#646464", accent: "#006884", accent2: "#375f65ff" },

        {
            bg: "#F4F1FA",      // lavanda bem clara
            text: "#2B2B2B",    // quase preto
            muted: "#6B6B6B",   // cinza médio
            accent: "#6C3BFF",  // roxo forte
            accent2: "#FF6B6B"  // coral vibrante
        },

        // {
        //     bg: "#F2F4F7",
        //     text: "#1A1A1A",
        //     muted: "#5C5C5C",
        //     accent: "#111827",
        //     accent2: "#3B82F6"
        // }
        // ,



        { bg: "#EFF8F8", text: "#0F172A", muted: "#334155", accent: "#10B981", accent2: "#60A5FA" },
        { bg: "#EFF8F8", text: "#111827", muted: "#4B5563", accent: "#F97316", accent2: "#FB7185" },
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
            accent: theme.bg, // sem accent pra cover
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

function compileCover(slide: any, theme: Theme) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;

    // shapes
    push(els, { id: "arrows", type: "shape", name: "arrows", x: 1080 - 175, y: 30, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });

    push(els, { id: "pill", type: "shape", name: "pillBadge", x: 30, y: 800, w: 350, color: theme.accent, opacity: 1, scale: 1 });

    ensureProfileCard(slide, theme);

    // BASE positions
    const textX = 96;
    const textW = 700; // um pouco menor pra não brigar com o canto/ornamentos

    // headline (sem h fixo)
    push(els, {
        id: "headline",
        type: "text",
        x: textX,
        y: 170,
        w: textW,
        text: slide.headline ?? "",
        fontSize: 84,
        lineHeight: 1.15,
        fontWeight: 900,
        align: "left",
        color: theme.text,
    });

    // body começa “perto”, mas o flow/autoLayout vai reposicionar certo
    push(els, {
        id: "body",
        type: "text",
        x: textX,
        y: 520,
        w: textW,
        text: slide.body ?? "",
        fontSize: 34,
        lineHeight: 1.25,
        fontWeight: 450,
        align: "left",
        color: theme.muted,
    });

    // image (garante existir)
    const img = ensureImage(slide, theme);
    Object.assign(img, {
        x: 1080 - 600,
        y: 1350 - 600,
        w: 600,
        h: 600,
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


    // alterna lado da imagem pra dar ritmo
    const imageOnRight = index % 2 === 0;

    const textX = imageOnRight ? 96 : 96;
    const textW = 650;

    if (imageOnRight) {
        push(els, { id: `arrows-top${index}`, type: "shape", name: "arrows", x: 1080 - 175, y: 30, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });
        push(els, { id: `arrows-bottom${index}`, type: "shape", name: "arrows", x: -175, y: 1350 - 150, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });


    } else {
        push(els, { id: `arrows-top${index}`, type: "shape", name: "arrows", x: -175, y: 30, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });
        push(els, { id: `arrows-bottom${index}`, type: "shape", name: "arrows", x: 1080 - 175, y: 1350 - 150, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });
    }

    push(els, {
        id: "headline",
        type: "text",
        x: textX,
        y: 200,
        w: textW,
        text: slide.headline ?? "",
        fontSize: 60,
        fontWeight: 800,
        align: "left",
        color: theme.text,
    });

    push(els, {
        id: "body",
        type: "text",
        x: textX,
        y: 360,
        w: textW,
        text: slide.body ?? "",
        fontSize: 32,
        fontWeight: 450,
        align: "left",
        color: theme.muted,
    });

    const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3) : [];
    if (bullets.length) {
        push(els, {
            id: "bullets",
            type: "text",
            x: textX,
            y: 560,
            w: textW,
            text: bullets.map((b: string) => `• ${b}`).join("\n"),
            fontSize: 30,
            fontWeight: 450,
            align: "left",
            color: theme.accent,
        });
    }

    // image
    const img = ensureImage(slide, theme);
    Object.assign(img, {
        x: imageOnRight ? 1080 - 600 : 0,
        y: 1350 - 600,
        w: 600,
        h: 600,
        fit: "contain",
        bg: "transparent",
        opacity: 1,
        kind: "complement",
    });


}

function compileCTA(slide: any, theme: Theme) {
    ensureCanvas(slide, theme);
    const els = slide.canvas.elements;
    ensureProfileCard(slide, theme);



    push(els, { id: "arrows", type: "shape", name: "arrows", x: - 175, y: 30, w: 350, h: 150, color: theme.accent, opacity: 1, scale: 1 });

    push(els, {
        id: "headline",
        type: "text",
        x: 96,
        y: 180,
        w: 880,
        text: slide.headline ?? "",
        fontSize: 72,
        fontWeight: 900,
        align: "left",
        color: theme.text,
    });

    push(els, {
        id: "body",
        type: "text",
        x: 96,
        y: 400,
        w: 880,
        text: slide.body ?? "",
        fontSize: 34,
        fontWeight: 450,
        align: "left",
        color: theme.muted,
    });

    const bullets = Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3) : [];
    if (bullets.length) {
        push(els, {
            id: "bullets",
            type: "text",
            x: 96,
            y: 620,
            w: 880,
            text: bullets.map((b: string) => `✓ ${b}`).join("\n"),
            fontSize: 32,
            fontWeight: 600,
            align: "left",
            color: theme.muted,
        });
    }


    // image
    const img = ensureImage(slide, theme);
    Object.assign(img, {
        x: (1080 / 2) - 300,
        y: 560,
        w: 600,
        h: 600,
        fit: "contain",
        bg: "transparent",
        opacity: 1,
        kind: "complement",
    });
}

export function editorial3D(input: Carousel): Carousel {
    const theme = pickTheme(input?.meta?.theme ?? "clean");

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
