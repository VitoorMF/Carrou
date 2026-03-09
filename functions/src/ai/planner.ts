import type OpenAI from "openai";
import { creativeDirectionSchema, type CreativeDirection } from "./schemas";

// Mantido apenas para compatibilidade de build.
// O caminho principal de geração não depende mais desse planner.
export async function planCreativeDirection(_params: {
    openai: OpenAI;
    userPrompt: string;
    model?: string;
}): Promise<CreativeDirection> {
    return creativeDirectionSchema.parse({});
}
