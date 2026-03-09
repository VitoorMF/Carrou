// functions/src/ai/planner.ts
import OpenAI from "openai";
import { creativeDirectionSchema, type CreativeDirection } from "./schemas";
import { buildCreativePlannerPrompt } from "./prompts";

function extractJson(text: string): string {
    const trimmed = text.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed;
    }

    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");

    if (first === -1 || last === -1 || last <= first) {
        throw new Error("Planner não retornou JSON válido.");
    }

    return trimmed.slice(first, last + 1);
}

export function detectPromptSignals(prompt: string) {
    const p = prompt.toLowerCase();

    return {
        legal: /advogado|advocacia|jur[ií]dico|direito|escrit[oó]rio/.test(p),
        medical: /m[eé]dico|dentista|cl[ií]nica|sa[uú]de|psic[oó]logo/.test(p),
        finance: /finan[cç]a|investimento|contador|contabilidade|imposto/.test(p),
        premium: /premium|luxo|alto padr[aã]o|sofisticado/.test(p),
        educational: /como|guia|aprenda|passo a passo|explica|entenda/.test(p),
        creator: /instagram|viral|engajamento|marketing|conte[uú]do|creator/.test(p),
        corporate: /empresa|b2b|consultoria|neg[oó]cio|corporativo/.test(p),
    };
}

export async function planCreativeDirection(params: {
    openai: OpenAI;
    userPrompt: string;
    model?: string;
}): Promise<CreativeDirection> {
    const { openai, userPrompt, model = "gpt-4o-mini" } = params;

    const signals = detectPromptSignals(userPrompt);

    const response = await openai.responses.create({
        model,
        input: buildCreativePlannerPrompt(userPrompt, signals),
        temperature: 0.2,
        max_output_tokens: 500,
    });

    const raw = response.output_text;
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);

    return creativeDirectionSchema.parse(parsed);
}
