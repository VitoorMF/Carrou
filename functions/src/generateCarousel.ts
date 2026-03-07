// functions/src/generateCarousel.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { planCreativeDirection } from "./ai/planner";
import { generateCarouselJson } from "./ai/generator";
import { normalizeCarousel } from "./ai/normalize";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

type GenerateCarouselPayload = {
    prompt: string;
};

export const generateCarousel = onCall(
    {
        region: "southamerica-east1",
        secrets: [OPENAI_API_KEY],
        timeoutSeconds: 120,
        memory: "1GiB",
    },
    async (request) => {
        const data = request.data as GenerateCarouselPayload | undefined;
        const prompt = data?.prompt?.trim();

        if (!prompt) {
            throw new HttpsError("invalid-argument", "O campo 'prompt' é obrigatório.");
        }

        try {
            const openai = new OpenAI({
                apiKey: OPENAI_API_KEY.value(),
            });

            const creativeDirection = await planCreativeDirection({
                openai,
                userPrompt: prompt,
                model: "gpt-5-mini",
            });

            const rawCarousel = await generateCarouselJson({
                openai,
                userPrompt: prompt,
                creativeDirection,
                model: "gpt-5",
            });

            const normalizedCarousel = normalizeCarousel(rawCarousel, creativeDirection);

            logger.info("Carousel gerado com sucesso", {
                prompt,
                visualStyle: creativeDirection.visual_style,
                tone: creativeDirection.tone,
                goal: creativeDirection.goal,
                slides: normalizedCarousel.slides.length,
            });

            return {
                ok: true,
                creativeDirection,
                carousel: normalizedCarousel,
            };
        } catch (error) {
            logger.error("Erro ao gerar carrossel", error);

            const message =
                error instanceof Error ? error.message : "Erro desconhecido ao gerar carrossel.";

            throw new HttpsError("internal", message);
        }
    }
);