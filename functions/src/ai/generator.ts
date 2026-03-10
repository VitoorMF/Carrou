import OpenAI from "openai";
import { buildCarouselGeneratorPrompt } from "./prompts";
import { carouselDraftSchema, type CarouselDraft } from "./schemas";

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

export async function generateCarouselJson(params: {
    openai: OpenAI;
    userPrompt: string;
    selectedTemplateLabel: string;
    model?: string;
}): Promise<CarouselDraft> {
    const {
        openai,
        userPrompt,
        selectedTemplateLabel,
        model = "gpt-4o-mini",
    } = params;

    const response = await openai.responses.create({
        model,
        input: buildCarouselGeneratorPrompt({
            userPrompt,
            selectedTemplateLabel,
        }),
        temperature: 0.45,
        max_output_tokens: 2600,
    });

    const raw = response.output_text;
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);

    return carouselDraftSchema.parse(parsed);
}
