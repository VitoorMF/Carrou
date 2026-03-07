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
    align: z.enum(["left", "center", "right"]).optional(),
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
    borderRadius: z.number().optional(),
    opacity: z.number().optional(),
});

export const elementSchema = z.union([
    textElementSchema,
    rectElementSchema,
    pathElementSchema,
    imageElementSchema,
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