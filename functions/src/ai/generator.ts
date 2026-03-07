// functions/src/ai/generator.ts
import OpenAI from "openai";
import { buildCarouselGeneratorPrompt } from "./prompts";
import { carouselSchema, type Carousel, type CreativeDirection } from "./schemas";

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
            return `
- visual sóbrio
- poucos adornos
- tipografia forte
- bastante respiro
- bom para jurídico, saúde, finanças e consultoria
- evitar exagero visual
      `.trim();

        case "luxury_minimal":
            return `
- composição premium
- menos informação por slide
- bastante respiro
- aparência sofisticada
- bom para alto padrão, estética, arquitetura
      `.trim();

        case "microblog_bold":
            return `
- foco em texto
- contraste maior
- visual de conteúdo educativo
- bom para posts didáticos, listas e passo a passo
      `.trim();

        case "social_dynamic":
            return `
- mais energia visual
- composições mais chamativas
- bom para creator economy, marketing e conteúdo social
      `.trim();

        case "clean_modern":
        default:
            return `
- moderno e limpo
- equilíbrio entre clareza e estilo
- composição flexível
      `.trim();
    }
}

export async function generateCarouselJson(params: {
    openai: OpenAI;
    userPrompt: string;
    creativeDirection: CreativeDirection;
    model?: string;
}): Promise<Carousel> {
    const {
        openai,
        userPrompt,
        creativeDirection,
        model = "gpt-5",
    } = params;

    const themeRules = getThemeRules(creativeDirection.visual_style);

    const response = await openai.responses.create({
        model,
        input: buildCarouselGeneratorPrompt({
            userPrompt,
            creativeDirection,
            themeRules,
        }),
    });

    const raw = response.output_text;
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);

    return carouselSchema.parse(parsed);
}