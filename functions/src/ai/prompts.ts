// functions/src/ai/prompts.ts
import type { CreativeDirection } from "./schemas";

export function buildCreativePlannerPrompt(userPrompt: string, signals?: Record<string, boolean>) {
    return `
Você é um Creative Planner para um gerador de carrosséis de Instagram.

Sua função NÃO é gerar o carrossel.
Sua única função é analisar o prompt do usuário e decidir a direção criativa ideal.

Responda SOMENTE em JSON válido.
Não use markdown.
Não explique nada fora do JSON.

Campos obrigatórios:
{
  "niche": string,
  "goal": "educar" | "vender" | "engajar" | "captar_leads" | "autoridade",
  "tone": "serio" | "profissional" | "didatico" | "premium" | "energetico" | "amigavel",
  "audience_awareness": "baixo" | "medio" | "alto",
  "visual_style": "editorial_minimal" | "luxury_minimal" | "microblog_bold" | "social_dynamic" | "clean_modern",
  "content_density": "low" | "medium" | "high",
  "layout_energy": "low" | "medium" | "high",
  "image_strategy": "none" | "minimal" | "single_hero" | "supportive",
  "narrative_structure": "hook_points_cta" | "hook_explanation_cta" | "hook_explanation_authority_cta" | "problem_solution_cta" | "myth_truth_cta" | "step_by_step_cta",
  "cta_style": "professional" | "direct" | "soft" | "urgent",
  "color_mood": "neutral_dark" | "light_clean" | "premium_warm" | "tech_cool" | "bold_contrast",
  "trust_signals": string[],
  "avoid": string[]
}

Regras:
- Temas jurídicos, médicos, financeiros ou corporativos pedem mais sobriedade.
- Temas educativos pedem clareza e hierarquia forte.
- Temas criativos, creator economy e marketing podem aceitar mais energia visual.
- Se o tema pede confiança, reduza exageros visuais.
- Não invente estilos inadequados.
- Escolha a direção mais apropriada ao contexto do prompt.

Sinais heurísticos detectados:
${JSON.stringify(signals ?? {}, null, 2)}

Prompt do usuário:
${userPrompt}
`.trim();
}

export function buildCarouselGeneratorPrompt(params: {
    userPrompt: string;
    creativeDirection: CreativeDirection;
    themeRules?: string;
}) {
    const { userPrompt, creativeDirection, themeRules } = params;

    return `
Você é um gerador de JSON para carrosséis de Instagram.

Sua função é gerar SOMENTE JSON válido, pronto para renderização.
Não explique nada fora do JSON.
Não use markdown.

OBJETIVO:
Criar um carrossel coerente com o prompt do usuário e com a direção criativa recebida.

REGRAS GERAIS:
- Documento sempre 1080x1350
- 4 a 6 slides
- IDs únicos por slide
- Textos curtos, claros e com boa hierarquia
- Evite excesso de elementos
- CTA coerente com o nível de formalidade
- O slide 1 deve ter hook forte
- O último slide deve fechar com CTA
- Não use elementos proibidos na lista "avoid"

REGRAS DE IMAGEM:
- Se image_strategy = "none", NÃO usar elementos type: "image"
- Se image_strategy = "minimal", usar no máximo 1 imagem em todo o carrossel
- Se image_strategy = "single_hero", usar no máximo 1 imagem por slide
- Se image_strategy = "supportive", usar imagens apenas quando ajudarem a narrativa

ESTRUTURA RECOMENDADA:
- slide 1 = hook / promessa / impacto
- slides intermediários = explicação / passos / pontos
- último slide = CTA

DIREÇÃO CRIATIVA:
${JSON.stringify(creativeDirection, null, 2)}

PROMPT DO USUÁRIO:
${userPrompt}

REGRAS DA FAMÍLIA VISUAL:
${themeRules ?? "Use uma composição coerente com a direção criativa."}

FORMATO DE SAÍDA:
{
  "meta": {
    "title": string,
    "objective": string,
    "style": string,
    "palette": {
      "bg": string,
      "text": string,
      "muted": string,
      "accent": string,
      "accent2": string
    }
  },
  "slides": [
    {
      "id": string,
      "elements": [
        {
          "id": string,
          "type": "background",
          "x": number,
          "y": number,
          "width": number,
          "height": number,
          "fill": string,
          "opacity": number
        },
        {
          "id": string,
          "type": "text",
          "x": number,
          "y": number,
          "text": string,
          "fill": string,
          "fontSize": number,
          "fontFamily": string,
          "fontStyle": string,
          "width": number,
          "align": "left" | "center" | "right",
          "opacity": number
        },
        {
          "id": string,
          "type": "path",
          "x": number,
          "y": number,
          "data": string,
          "fill": string,
          "opacity": number
        },
        {
          "id": string,
          "type": "image",
          "x": number,
          "y": number,
          "width": number,
          "height": number,
          "prompt": string,
          "borderRadius": number,
          "opacity": number
        }
      ]
    }
  ]
}

IMPORTANTE:
- Se usar "image", preencha SEMPRE "prompt"
- Nunca use "src"
- Saída deve ser JSON puro
`.trim();
}