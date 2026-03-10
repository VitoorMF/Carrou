import { z } from "zod";

export const carouselDraftSchema = z.object({
    meta: z.object({
        title: z.string().min(1),
        objective: z.string().min(1).default("engajar"),
        style: z.string().min(1).default("template-driven"),
    }),
    slides: z.array(
        z.object({
            id: z.string(),
            role: z.enum(["cover", "content", "cta"]),
            headline: z.string().min(1),
            body: z.string().default(""),
            bullets: z.array(z.string()).max(6).default([]),
            footer: z.string().optional(),
            imagePrompt: z.string().optional(),
            notes: z.string().optional(),
        })
    ).min(4).max(8),
});

export type CarouselDraft = z.infer<typeof carouselDraftSchema>;

export type CarouselElement =
    | ({ id: string; type: "text"; x: number; y: number; text: string; fill: string } & Record<string, unknown>)
    | ({ id: string; type: "background"; x: number; y: number; width: number; height: number; fill: string } & Record<string, unknown>)
    | ({ id: string; type: "path"; x: number; y: number; data: string; fill: string } & Record<string, unknown>)
    | ({ id: string; type: "arrow"; x: number; y: number; data: string; fill: string } & Record<string, unknown>)
    | ({ id: string; type: "image"; x: number; y: number; width: number; height: number; prompt: string } & Record<string, unknown>)
    | ({ id: string; type: "gradientRect"; x: number; y: number; width: number; height: number; kind: "linear" | "radial" } & Record<string, unknown>)
    | ({ id: string; type: "glow"; x: number; y: number; r: number; color: string; blur: number } & Record<string, unknown>)
    | ({ id: string; type: "glassCard"; x: number; y: number; width: number; height: number; radius: number } & Record<string, unknown>)
    | ({ id: string; type: "backgroundImage"; x: number; y: number; width: number; height: number } & Record<string, unknown>)
    | ({ id: string; type: "noise"; x: number; y: number; width: number; height: number; url: string } & Record<string, unknown>);

export type Carousel = {
    meta: {
        title: string;
        objective: string;
        style: string;
        palette?: {
            bg: string;
            text: string;
            muted?: string;
            accent?: string;
            accent2?: string;
        };
    };
    slides: Array<{
        id: string;
        elements: CarouselElement[];
    }>;
};
