import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import cors from "cors";

import { generateCarouselJson, resolveGenerationContext } from "./ai/generator";
import { normalizeCarousel } from "./ai/normalize";
import { findTemplateById, getDefaultTemplate } from "./ai/templateCatalog";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const corsHandler = cors({ origin: true });

if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

function extractProviderErrorMessage(error: any): string {
    if (!error) return "Erro desconhecido";

    const providerMessage =
        error?.error?.message
        ?? error?.response?.data?.error?.message
        ?? error?.message;

    if (!providerMessage) return "Erro desconhecido";
    return String(providerMessage);
}

function stripUndefinedDeep<T>(value: T): T {
    if (Array.isArray(value)) {
        return value
            .filter((item) => item !== undefined)
            .map((item) => stripUndefinedDeep(item)) as T;
    }

    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};

        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            if (child === undefined) continue;
            out[key] = stripUndefinedDeep(child);
        }

        return out as T;
    }

    return value;
}

type GenerateCarouselPayload = {
    prompt: string;
    templateId?: string;
    theme?: string;
};

type AnyEl = {
    id: string;
    type: string;
    [key: string]: any;
};

type FlatSlide = {
    id: string;
    elements?: AnyEl[];
};

type LayeredSlide = {
    id: string;
    layers: {
        background: AnyEl[];
        atmosphere: AnyEl[];
        content: AnyEl[];
        ui: AnyEl[];
    };
};

function toLayeredSlide(slide: FlatSlide): LayeredSlide {
    const background: AnyEl[] = [];
    const atmosphere: AnyEl[] = [];
    const content: AnyEl[] = [];
    const ui: AnyEl[] = [];

    for (const el of slide.elements ?? []) {
        if (el.type === "background") {
            background.push(el);
            continue;
        }

        content.push(el);
    }

    return {
        id: slide.id,
        layers: {
            background,
            atmosphere,
            content,
            ui,
        },
    };
}

export const generateCarousel = onRequest(
    {
        region: "southamerica-east1",
        invoker: "public",
        secrets: [OPENAI_API_KEY],
        timeoutSeconds: 300,
        memory: "1GiB",
    },
    (req, res) =>
        corsHandler(req, res, async () => {
            logger.info("generateCarousel iniciou");

            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }

            if (req.method !== "POST") {
                res.status(405).json({ ok: false, error: "Use POST" });
                return;
            }

            const data = req.body as GenerateCarouselPayload | undefined;
            const prompt = data?.prompt?.trim();
            const selectedTemplate = findTemplateById(data?.templateId);
            const requestedTheme = data?.theme?.trim() || "";

            if (!prompt) {
                res.status(400).json({ ok: false, error: "O campo 'prompt' é obrigatório." });
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                return;
            }

            const idToken = authHeader.slice("Bearer ".length).trim();

            let uid: string | null = null;
            try {
                const decoded = await getAuth().verifyIdToken(idToken);
                uid = decoded.uid;
            } catch (error) {
                logger.warn("token inválido", { error });
                res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                return;
            }

            try {
                const openai = new OpenAI({
                    apiKey: OPENAI_API_KEY.value(),
                });

                const generationContext = resolveGenerationContext(prompt, selectedTemplate?.id);
                const activeTemplate = selectedTemplate ?? generationContext.activeTemplate ?? getDefaultTemplate();
                const resolvedTheme = requestedTheme || activeTemplate.defaultTheme;

                let rawCarousel;
                try {
                    rawCarousel = await generateCarouselJson({
                        openai,
                        userPrompt: prompt,
                        templateId: activeTemplate.id,
                        model: "gpt-4o-mini",
                    });
                } catch (error: any) {
                    const detail = extractProviderErrorMessage(error);
                    logger.error("generator falhou", { detail, raw: error });
                    throw new Error(`Falha no generator: ${detail}`);
                }

                const normalizedCarousel = normalizeCarousel(rawCarousel, {
                    templateId: activeTemplate.id,
                    theme: resolvedTheme,
                    userPrompt: prompt,
                });

                const editorCarousel = {
                    ...normalizedCarousel,
                    slides: normalizedCarousel.slides.map(toLayeredSlide),
                };

                const safeNormalizedCarousel = stripUndefinedDeep(normalizedCarousel);
                const safeEditorSlides = stripUndefinedDeep(editorCarousel.slides);
                const safeMeta = stripUndefinedDeep({
                    ...editorCarousel.meta,
                    templateId: activeTemplate.id,
                    theme: resolvedTheme,
                });

                const docRef = await db.collection("projects").add({
                    ownerId: uid,
                    status: "ready",
                    meta: safeMeta,
                    ai: {
                        generator: "generateCarousel:simple-v1",
                        prompt,
                        templateId: activeTemplate.id,
                        theme: resolvedTheme,
                        normalized: safeNormalizedCarousel,
                    },
                    slides: safeEditorSlides,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                res.status(200).json({
                    ok: true,
                    projectId: docRef.id,
                });
            } catch (error: any) {
                logger.error("Erro ao gerar carrossel", {
                    message: error?.message ?? null,
                    stack: error?.stack ?? null,
                    code: error?.code ?? null,
                    details: error?.details ?? null,
                });

                res.status(500).json({
                    ok: false,
                    error: error instanceof Error ? error.message : "Erro desconhecido ao gerar carrossel.",
                });
            }
        })
);
