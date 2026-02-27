import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";
import cors from "cors";



const corsHandler = cors({ origin: true });
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");


function buildPrompt(params: {
    prompt: string;
    objective?: string | null;
    format?: string | null;
    audience?: string | null;
    cta?: string | null;
    theme?: string | null;
    slideCount?: number | null;
}) {
    const {
        prompt,
        objective = "educacional",
        format = "dicas",
        audience = "iniciante",
        cta = "salvar",
        theme = "clean",
        slideCount = 6,
    } = params;

    return `
  Você é um gerador de carrosséis para Instagram (1080x1350 por slide).
  Retorne APENAS um JSON válido (sem markdown) no formato abaixo: 
  {
    "meta": {
        "title": string,
        "language": "pt-BR",
        "format": string,
        "objective": string,
        "audience": string,
        "cta": string,
        "style": "clean" | "bold" | "playful",
        "slideCount": number
    },
    "slides": [
        {
            "id": "s1",
            "role": "cover" | "content" | "cta",
            "headline": string,
            "body": string,
            "bullets": string[],
            "footer"?: string,
            "design"?: {
                "emphasis"?: string[]
            },
            "canvas": {
                "background": {
                    "type": "solid" | "gradient",
                    "value": string
                },
                "elements": [
                    // CanvasElement:
                    // image: {id,type:"image",src?,prompt?,kind:"complement",bg:"transparent",fit?:"contain"|"cover",}
                ]
            }
        }
    ]
  }

REGRAS DE LAYOUT (MUITO IMPORTANTES):

O documento é sempre 1080x1350.

Máximo por slide:

textos: até 3 (headline/body/bullets em blocos)

images: até 1

IDs devem ser únicos por slide.


IMAGENS (OBRIGATÓRIO):

O carrossel DEVE conter elementos do tipo "image".

No slide com id: "s4", NÃO inclua nenhum elemento type:"image"

Use o MESMO CONCEITO VISUAL nessas images (continuidade), mudando apenas enquadramento/posição/escala.


Para image:

Preencha SEMPRE o campo "prompt" (NUNCA use "src").

Sempre use: "kind": "complement",
"bg": "transparent",
"fit": "contain",
"opacity": 1.

A imagem deve ser um asset de borda (canto inferior/direita/esquerda), jamais atrás do texto.

NÃO pode haver texto sobre a imagem.

ESTILO VISUAL DAS IMAGENS (3D CARTOON COLORIDO, CLEAN):

As images devem ser 3D cartoon / 3D art moderno (estilo ícone 3D),
com formas arredondadas e materiais suaves, MAS COM CORES REAIS E VIVAS (sem parecer “clay branco”).

Regras obrigatórias pro prompt da imagem:

- Sempre comece com: "3D cartoon-style object representing {conceito do slide}"
- Use: "modern 3D illustration, smooth rounded shapes"
- Cores: "true-to-life colors, vivid but balanced palette, medium saturation"
- Luz: "neutral studio lighting" (evite "soft editorial lighting")
- Fundo: "transparent background"
- Sem texto: "no text"
- Proíba explicitamente: "avoid beige, avoid pastel tones, avoid washed-out colors, avoid monochrome white"

Formato do prompt (exemplo de template):
"3D cartoon-style object, modern 3D illustration, smooth rounded shapes, realistic but stylized materials, true-to-life colors, vivid but balanced palette, medium saturation, neutral studio lighting, subtle shadow, no text, transparent background, avoid beige, avoid pastel tones, avoid washed-out colors, avoid monochrome white"

CONSISTÊNCIA (IMPORTANTE):

Reutilize a mesma paleta entre slides.

Agora gere um carrossel com base nesses inputs:

Prompt do usuário: ${prompt}
Meta: 
    objective=${objective}, 
    format=${format}, 
    audience=${audience}, 
    cta=${cta}, 
    theme=${theme}, 
    slideCount=${slideCount}, 
    language=pt-BR

Retorne APENAS o JSON final.

    `.trim();
}

function safeJsonParse(text: string) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Sem JSON no output.");
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}

export const generateCarousel = onRequest(
    { secrets: [OPENAI_API_KEY] },
    (req, res) => {
        corsHandler(req, res, async () => {
            try {
                const client = new OpenAI({
                    apiKey: OPENAI_API_KEY.value(),
                });

                if (req.method === "OPTIONS") {
                    res.status(204).send("");
                    return;
                }

                if (req.method !== "POST") {
                    res.status(405).json({ error: "Use POST" });
                    return;
                }


                const body = req.body ?? {};
                const meta = body.meta ?? {};

                const prompt = String(body.prompt ?? "").trim();
                if (!prompt) {
                    res.status(400).json({ error: "prompt é obrigatório" });
                    return;
                }


                const slideCount = Number(meta.slideCount ?? 6);
                const finalSlideCount = Number.isFinite(slideCount)
                    ? Math.min(Math.max(slideCount, 5), 10)
                    : 6;

                const built = buildPrompt({
                    prompt,
                    objective: meta.objective,
                    format: meta.format,
                    audience: meta.audience,
                    cta: meta.cta,
                    theme: meta.theme,
                    slideCount: finalSlideCount,
                });

                const ai = await client.responses.create({
                    model: "gpt-4.1-mini",
                    input: built,
                });

                const raw = ai.output_text ?? "";
                const carousel = safeJsonParse(raw);

                // mini validação defensiva
                if (!carousel?.slides?.length) throw new Error("JSON inválido: sem slides.");

                res.json({ ok: true, carousel });
            } catch (err: any) {
                logger.error("generateCarousel error", err);

                res.set("Access-Control-Allow-Origin", req.headers.origin ?? "*");

                res.status(500).json({ error: err?.message ?? "Erro interno" });
            }
        });
    });