import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";
import cors from "cors";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const corsHandler = cors({ origin: true });

export const improvePrompt = onRequest(
    { secrets: [OPENAI_API_KEY], region: "us-central1", invoker: "public" },
    (req, res) => {
        corsHandler(req, res, async () => {
            try {
                if (req.method === "OPTIONS") {
                    res.status(204).send("");
                    return;
                }

                if (req.method !== "POST") {
                    res.status(405).json({ error: "Use POST" });
                    return;
                }

                const { prompt, objective, format, audience, cta, theme } = req.body ?? {};
                if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
                    res.status(400).json({ error: "prompt é obrigatório" });
                    return;
                }

                const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

                const meta = {
                    objective: objective ?? null,
                    format: format ?? null,
                    audience: audience ?? null,
                    cta: cta ?? null,
                    theme: theme ?? null,
                };

                const system = `
Você melhora prompts para gerar carrosséis (Instagram).
Regras:
- Responda somente com o PROMPT FINAL (sem explicação, sem markdown).
- Mantenha pt-BR.
- Deixe claro e executável.
- Sugira estrutura de slides (curto), e CTA se fizer sentido.
- Se não houver número de slides, use 6.
- Use as preferências como contexto, sem forçar.
        `.trim();

                const user = `
PROMPT ORIGINAL:
${prompt.trim()}

PREFERÊNCIAS:
${JSON.stringify(meta, null, 2)}

Reescreva o prompt para ficar mais claro, estruturado e pronto para gerar um carrossel.
        `.trim();

                // padroniza com a Responses API (igual seu generateCarousel)
                const ai = await client.responses.create({
                    model: "gpt-4.1-mini",
                    input: [
                        { role: "system", content: system },
                        { role: "user", content: user },
                    ],
                    temperature: 0.3,
                });

                const improved = (ai.output_text ?? "").trim();
                if (!improved) {
                    res.status(500).json({ error: "empty response" });
                    return;
                }

                res.status(200).json({ improvedPrompt: improved });
            } catch (err: any) {
                logger.error("improvePrompt error", err);
                res.set("Access-Control-Allow-Origin", req.headers.origin ?? "*");
                res.status(500).json({ error: err?.message ?? "Erro interno" });
            }
        });
    }
);
