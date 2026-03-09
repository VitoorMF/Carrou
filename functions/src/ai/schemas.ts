import { z } from "zod";

export const creativeDirectionSchema = z.object({
    niche: z.string().default("general"),
    goal: z.string().default("educar"),
    tone: z.string().default("didatico"),
    audience_awareness: z.string().default("medio"),
    visual_style: z.string().default("microblog_bold"),
    content_density: z.string().default("medium"),
    layout_energy: z.string().default("medium"),
    image_strategy: z.string().default("supportive"),
    narrative_structure: z.string().default("hook_explanation_cta"),
    cta_style: z.string().default("professional"),
    color_mood: z.string().default("bold_contrast"),
    trust_signals: z.array(z.string()).default([]),
    avoid: z.array(z.string()).default([]),
});

export type CreativeDirection = z.infer<typeof creativeDirectionSchema>;

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
    status: z.string().optional(),
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
    status: z.string().optional(),
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
    slides: z.array(slideSchema).min(4).max(8),
});

export type Carousel = z.infer<typeof carouselSchema>;
