import type { Carousel } from "./types/caroussel";

export type CanvasElement =
    | {
        type: "text";
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
        text: string;
        fontSize: number;
        fontWeight?: number;
        align?: "left" | "center" | "right";
    }
    | { type: "shape"; id: string; x: number; y: number; w: number; h: number; radius?: number };

export type ProjectDoc = {
    ownerId: string;
    createdAt: any;
    updatedAt: any;
    status: "ready" | "generating" | "error";
    meta: Carousel["meta"];
    ai: { generator: string; raw: Carousel };
    slides: Array<
        Carousel["slides"][0] & {
            canvas: {
                background: { type: "solid"; value: string };
                elements: CanvasElement[];
            };
        }
    >;
};

const SLIDE_W = 1080;
const SLIDE_H = 1080;

// garante string/array mesmo se vier algo faltando
function safeText(v: unknown) {
    return typeof v === "string" ? v : "";
}

function safeBullets(v: unknown) {
    return Array.isArray(v) ? v.map((b) => String(b)) : [];
}

function buildCanvasForSlide(slide: Carousel["slides"][0]) {
    const elements: CanvasElement[] = [];

    const headline = safeText(slide.headline);
    const body = safeText(slide.body);
    const bullets = safeBullets(slide.bullets);

    // headline
    elements.push({
        type: "text",
        id: `t_head_${slide.id}`,
        x: 80,
        y: 120,
        w: SLIDE_W - 160,
        h: SLIDE_H - 140,
        text: headline,
        fontSize: slide.role === "cover" ? 84 : 64,
        fontWeight: 700,
        align: slide.design?.layout === "center" ? "center" : "left",
    });

    // body
    elements.push({
        type: "text",
        id: `t_body_${slide.id}`,
        x: 100,
        y: slide.role === "cover" ? 320 : 280,
        w: SLIDE_W - 200,
        h: 260,
        text: body,
        fontSize: 40,
        fontWeight: 400,
        align: slide.design?.layout === "center" ? "center" : "left",
    });

    // bullets
    if (bullets.length) {
        const bulletsText = bullets.map((b) => `• ${b}`).join("\n");
        elements.push({
            type: "text",
            id: `t_bul_${slide.id}`,
            x: 120,
            y: 560,
            w: SLIDE_W - 240,
            h: 320,
            text: bulletsText,
            fontSize: 36,
            fontWeight: 500,
            align: "left",
        });
    }

    // footer
    if (slide.footer) {
        elements.push({
            type: "text",
            id: `t_foot_${slide.id}`,
            x: 80,
            y: 980,
            w: SLIDE_W - 160,
            h: 80,
            text: slide.footer,
            fontSize: 28,
            fontWeight: 500,
            align: "center",
        });
    }

    return {
        background: { type: "solid" as const, value: "#ffffff" },
        elements,
    };
}

export function buildProjectSlides(carousel: Carousel) {
    return carousel.slides.map((slide) => ({
        ...slide,
        // garante defaults pra não quebrar o editor se IA mandar opcional
        body: slide.body ?? "",
        bullets: slide.bullets ?? [],
        canvas: buildCanvasForSlide(slide),
    }));
}
