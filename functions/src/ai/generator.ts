import OpenAI from "openai";
import { buildCarouselGeneratorPrompt } from "./prompts";
import { carouselDraftSchema, type CarouselDraft, type CreativeDirection } from "./schemas";

function extractJson(text: string): string {
    const trimmed = text.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed;
    }

    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");

    if (first === -1 || last === -1 || last <= first) {
        throw new Error("Generator não retornou JSON válido.");
    }

    return trimmed.slice(first, last + 1);
}

export function getThemeRules(visualStyle: CreativeDirection["visual_style"]) {
    switch (visualStyle) {
        case "editorial_minimal":
            return `visual sóbrio, pouco ruído, autoridade e clareza`;
        case "luxury_minimal":
            return `premium, sofisticado, poucas palavras por slide, bastante respiro`;
        case "microblog_bold":
            return `conteúdo educativo, forte em texto, ritmo direto`;
        case "social_dynamic":
            return `mais energia, chamativo, linguagem mais viva`;
        case "clean_modern":
        default:
            return `moderno, limpo, equilibrado e claro`;
    }
}

export async function generateCarouselJson(params: {
    openai: OpenAI;
    userPrompt: string;
    creativeDirection: CreativeDirection;
    model?: string;
}): Promise<CarouselDraft> {
    const {
        openai,
        userPrompt,
        creativeDirection,
        model = "gpt-4o-mini",
    } = params;

    const themeRules = getThemeRules(creativeDirection.visual_style);

    const response = await openai.responses.create({
        model,
        input: buildCarouselGeneratorPrompt({
            userPrompt,
            creativeDirection,
            themeRules,
        }),
        temperature: 0.45,
        max_output_tokens: 2600,
    });

    const raw = response.output_text;
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);

    return carouselDraftSchema.parse(parsed);
}
