import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import cors from "cors";

import { generateCarouselJson } from "./ai/generator";
import { normalizeCarousel } from "./ai/normalize";
import { findTemplateById, inferTemplateFromPrompt } from "./ai/templateCatalog";
import { buildLayeredTemplateCarousel, type TemplateDraft } from "../../shared/templateEngine";

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

function toTemplateDraft(contentCarousel: any): TemplateDraft {
    return {
        meta: {
            title: contentCarousel?.meta?.title,
            objective: contentCarousel?.meta?.objective,
        },
        slides: Array.isArray(contentCarousel?.slides)
            ? contentCarousel.slides.map((slide: any) => ({
                id: slide?.id,
                role: slide?.role,
                headline: slide?.headline,
                body: slide?.body,
                bullets: slide?.bullets,
                imagePrompt: slide?.imagePrompt,
                notes: slide?.notes,
            }))
            : [],
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
            logger.info("request.data", { data });

            const prompt = data?.prompt?.trim();
            const templateId = data?.templateId?.trim();
            const theme = data?.theme?.trim();
            logger.info("prompt resolvido", { prompt, templateId, theme });

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

            logger.info("auth", { uid: uid ?? null });

            try {
                const t0 = Date.now();

                const openai = new OpenAI({
                    apiKey: OPENAI_API_KEY.value(),
                });
                logger.info("OpenAI client criado");

                const requestedTemplate = findTemplateById(templateId);
                const inferredTemplate = inferTemplateFromPrompt(prompt);
                const selectedTemplate = requestedTemplate ?? inferredTemplate;
                logger.info("template resolvido", {
                    ms: Date.now() - t0,
                    requestedTemplateId: templateId ?? null,
                    selectedTemplateId: selectedTemplate.id,
                });

                const t1 = Date.now();

                let contentCarousel;
                try {
                    contentCarousel = await generateCarouselJson({
                        openai,
                        userPrompt: prompt,
                        selectedTemplateLabel: selectedTemplate.label,
                        model: "gpt-4o-mini",
                    });
                } catch (error: any) {
                    const detail = extractProviderErrorMessage(error);
                    logger.error("generator falhou", { detail, raw: error });
                    throw new Error(`Falha no generator: ${detail}`);
                }
                logger.info("generator concluído", {
                    ms: Date.now() - t1,
                    slideCount: contentCarousel.slides?.length ?? null,
                });

                const normalizedCarousel = normalizeCarousel(contentCarousel, {
                    prompt,
                    templateId: selectedTemplate.id,
                });

                const renderCarousel = buildLayeredTemplateCarousel(
                    selectedTemplate.id,
                    toTemplateDraft(contentCarousel)
                );

                const safeNormalizedCarousel = stripUndefinedDeep(normalizedCarousel);
                const safeRenderCarousel = stripUndefinedDeep(renderCarousel);
                const safeEditorSlides = stripUndefinedDeep(renderCarousel.slides);
                const safeMeta = stripUndefinedDeep(renderCarousel.meta);

                logger.info("normalize concluído", {
                    slideCount: renderCarousel.slides.length,
                    title: renderCarousel.meta?.title ?? null,
                    selectedTemplateId: normalizedCarousel.selectedTemplateId,
                });

                logger.info("antes do firestore.add");

                const docRef = await db.collection("projects").add({
                    ownerId: uid,
                    status: "ready",
                    meta: safeMeta,
                    ai: {
                        generator: "generateCarousel:simple-v3",
                        prompt,
                        templateId: normalizedCarousel.selectedTemplateId,
                        theme: theme ?? null,
                        content: stripUndefinedDeep(contentCarousel),
                        raw: stripUndefinedDeep(contentCarousel),
                        normalized: safeNormalizedCarousel,
                    },
                    renderCarousel: safeRenderCarousel,
                    // Compat legado: mantido para rotas/funções antigas.
                    slides: safeEditorSlides,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                logger.info("firestore.add concluído", { projectId: docRef.id });

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
