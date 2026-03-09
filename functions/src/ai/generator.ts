import OpenAI from "openai";
import { buildCarouselGeneratorPrompt } from "./prompts";
import { carouselSchema, type Carousel } from "./schemas";
import { findTemplateById, getDefaultTemplate, resolveTemplateFromPrompt } from "./templateCatalog";

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

export function resolveGenerationContext(userPrompt: string, templateId?: string | null) {
    const selectedTemplate = findTemplateById(templateId);
    const activeTemplate = selectedTemplate ?? resolveTemplateFromPrompt(userPrompt) ?? getDefaultTemplate();

    const normalizedPrompt = userPrompt.toLowerCase();
    const tone = /advogado|jur[ií]dico|contador|contabilidade|imposto|m[eé]dico|sa[uú]de|cl[ií]nica/.test(normalizedPrompt)
        ? "profissional"
        : /personal|academia|fitness|treino|instagram|marketing|creator/.test(normalizedPrompt)
            ? "dinâmico"
            : "didático";

    const objective = /vender|clientes|agenda|consulta|leads/.test(normalizedPrompt)
        ? "captar clientes"
        : "educar";

    return {
        activeTemplate,
        tone,
        objective,
    };
}

export async function generateCarouselJson(params: {
    openai: OpenAI;
    userPrompt: string;
    templateId?: string | null;
    model?: string;
}): Promise<Carousel> {
    const {
        openai,
        userPrompt,
        templateId,
        model = "gpt-4o-mini",
    } = params;

    const context = resolveGenerationContext(userPrompt, templateId);

    const response = await openai.responses.create({
        model,
        input: buildCarouselGeneratorPrompt({
            userPrompt,
            templateLabel: context.activeTemplate.label,
            tone: context.tone,
            objective: context.objective,
        }),
        temperature: 0.35,
        max_output_tokens: 2600,
    });

    const raw = response.output_text;
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);

    return carouselSchema.parse(parsed);
}
