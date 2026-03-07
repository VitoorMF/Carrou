// functions/src/ai/schemas.ts
import { z } from "zod";

export const creativeDirectionSchema = z.object({
    niche: z.string().min(1),
    goal: z.enum(["educar", "vender", "engajar", "captar_leads", "autoridade"]),
    tone: z.enum(["serio", "profissional", "didatico", "premium", "energetico", "amigavel"]),
    audience_awareness: z.enum(["baixo", "medio", "alto"]),
    visual_style: z.enum([
        "editorial_minimal",
        "luxury_minimal",
        "microblog_bold",
        "social_dynamic",
        "clean_modern",
    ]),
    content_density: z.enum(["low", "medium", "high"]),
    layout_energy: z.enum(["low", "medium", "high"]),
    image_strategy: z.enum(["none", "minimal", "single_hero", "supportive"]),
    narrative_structure: z.enum([
        "hook_points_cta",
        "hook_explanation_cta",
        "hook_explanation_authority_cta",
        "problem_solution_cta",
        "myth_truth_cta",
        "step_by_step_cta",
    ]),
    cta_style: z.enum(["professional", "direct", "soft", "urgent"]),
    color_mood: z.enum([
        "neutral_dark",
        "light_clean",
        "premium_warm",
        "tech_cool",
        "bold_contrast",
    ]),
    trust_signals: z.array(z.string()).max(8),
    avoid: z.array(z.string()).max(12),
});

export type CreativeDirection = z.infer<typeof creativeDirectionSchema>;

/**
 * Esse schema é um EXEMPLO mínimo para o carrossel final.
 * Ajuste para bater 100% com o teu tipo real.
 */
export const carouselMetaSchema = z.object({
    title: z.string().min(1),
    objective: z.string().min(1).default("engajar"),
    style: z.string().min(1),
    palette: z
        .object({
            bg: z.string(),
            text: z.string(),
            muted: z.string().optional(),
            accent: z.string().optional(),
            accent2: z.string().optional(),
        })
        .optional(),
});

export const textElementSchema = z.object({
    id: z.string(),
    type: z.literal("text"),
    x: z.number(),
    y: z.number(),
    text: z.string(),
    fill: z.string(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    fontStyle: z.string().optional(),
    width: z.number().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
    lineHeight: z.number().optional(),
    letterSpacing: z.number().optional(),
    opacity: z.number().optional(),
});

export const rectElementSchema = z.object({
    id: z.string(),
    type: z.literal("background"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    fill: z.string(),
    opacity: z.number().optional(),
});

const vec2Schema = z.object({
    x: z.number(),
    y: z.number(),
});

export const pathElementSchema = z.object({
    id: z.string(),
    type: z.literal("path"),
    x: z.number(),
    y: z.number(),
    data: z.string(),
    fill: z.string(),
    opacity: z.number().optional(),
});

export const imageElementSchema = z.object({
    id: z.string(),
    type: z.literal("image"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    prompt: z.string().min(1),
    url: z.string().url().optional(),
    src: z.string().url().optional(),
    radius: z.number().optional(),
    borderRadius: z.number().optional(),
    rotate: z.number().optional(),
    fit: z.enum(["cover", "contain"]).optional(),
    cover: z.enum(["cover", "contain"]).optional(),
    opacity: z.number().optional(),
});

export const gradientRectElementSchema = z.object({
    id: z.string(),
    type: z.literal("gradientRect"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    kind: z.enum(["linear", "radial"]),
    start: vec2Schema.optional(),
    end: vec2Schema.optional(),
    center: vec2Schema.optional(),
    radius: z.number().optional(),
    // Firestore não aceita array aninhado; aceitamos legado em pares e formato novo flat.
    stops: z.union([
        z.array(z.tuple([z.number().min(0).max(1), z.string()])).min(2).max(6),
        z.array(z.union([z.number().min(0).max(1), z.string()]))
            .min(4)
            .max(12)
            .refine(
                (arr) => arr.length % 2 === 0 && arr.every((v, i) => (i % 2 === 0 ? typeof v === "number" : typeof v === "string")),
                "stops flat deve seguir [offset, color, offset, color]"
            ),
    ]),
    opacity: z.number().optional(),
});

export const glowElementSchema = z.object({
    id: z.string(),
    type: z.literal("glow"),
    x: z.number(),
    y: z.number(),
    r: z.number(),
    color: z.string(),
    blur: z.number(),
    opacity: z.number().optional(),
});

export const glassCardElementSchema = z.object({
    id: z.string(),
    type: z.literal("glassCard"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    radius: z.number(),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    opacity: z.number().optional(),
    shadow: z
        .object({
            blur: z.number(),
            y: z.number(),
            opacity: z.number(),
        })
        .optional(),
});

export const backgroundImageElementSchema = z.object({
    id: z.string(),
    type: z.literal("backgroundImage"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    prompt: z.string().min(1).optional(),
    url: z.string().url().optional(),
    src: z.string().url().optional(),
    opacity: z.number().optional(),
});

export const noiseElementSchema = z.object({
    id: z.string(),
    type: z.literal("noise"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    url: z.string(),
    opacity: z.number().optional(),
});

export const elementSchema = z.union([
    textElementSchema,
    rectElementSchema,
    pathElementSchema,
    imageElementSchema,
    gradientRectElementSchema,
    glowElementSchema,
    glassCardElementSchema,
    backgroundImageElementSchema,
    noiseElementSchema,
]);

export const slideSchema = z.object({
    id: z.string(),
    elements: z.array(elementSchema).max(20),
});

export const carouselSchema = z.object({
    meta: carouselMetaSchema,
    slides: z.array(slideSchema).min(4).max(10),
});

export type Carousel = z.infer<typeof carouselSchema>;
