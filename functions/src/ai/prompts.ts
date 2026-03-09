import type { CreativeDirection } from "./schemas";

export function buildCreativePlannerPrompt(userPrompt: string) {
  return `
Você é um estrategista de conteúdo para carrosséis do Instagram.
Analise o prompt do usuário e retorne JSON puro com uma direção criativa objetiva.

PROMPT:
${userPrompt}

RETORNE EXATAMENTE:
{
  "niche": "string",
  "goal": "educar|vender|engajar|captar_leads|autoridade",
  "tone": "serio|profissional|didatico|premium|energetico|amigavel",
  "audience_awareness": "baixo|medio|alto",
  "visual_style": "editorial_minimal|luxury_minimal|microblog_bold|social_dynamic|clean_modern",
  "content_density": "low|medium|high",
  "layout_energy": "low|medium|high",
  "image_strategy": "none|minimal|single_hero|supportive",
  "narrative_structure": "hook_points_cta|hook_explanation_cta|hook_explanation_authority_cta|problem_solution_cta|myth_truth_cta|step_by_step_cta",
  "cta_style": "professional|direct|soft|urgent",
  "color_mood": "neutral_dark|light_clean|premium_warm|tech_cool|bold_contrast",
  "trust_signals": ["string"],
  "avoid": ["string"]
}
`.trim();
}

export function buildCarouselGeneratorPrompt(params: {
  userPrompt: string;
  creativeDirection: CreativeDirection;
  themeRules: string;
}) {
  const { userPrompt, creativeDirection, themeRules } = params;

  return `
Você cria a ESTRUTURA DE CONTEÚDO de um carrossel de Instagram.

IMPORTANTE:
- Você NÃO define elementos visuais.
- Você NÃO define x, y, width, height, cor, fonte, SVG, shape, glow, background ou layout.
- O template do sistema resolverá toda a parte visual.
- Sua função é devolver apenas conteúdo semântico para cada slide.
- Retorne JSON puro, sem markdown.

PROMPT DO USUÁRIO:
${userPrompt}

DIREÇÃO CRIATIVA:
- niche: ${creativeDirection.niche}
- goal: ${creativeDirection.goal}
- tone: ${creativeDirection.tone}
- narrative_structure: ${creativeDirection.narrative_structure}
- image_strategy: ${creativeDirection.image_strategy}

PISTAS VISUAIS DO TEMPLATE (apenas para influenciar tom, não para você desenhar):
${themeRules}

REGRAS:
- use 4 a 6 slides
- slide 1 deve ser role = "cover"
- slide final deve ser role = "cta"
- slides do meio devem ser role = "content"
- headline curta e forte
- body claro, específico e utilizável
- bullets opcionais, mas quando usar mantenha 3 a 5 itens
- imagePrompt é opcional, mas útil quando uma imagem ajudaria o template
- escreva em pt-BR
- evite clichês e frases vazias

FORMATO EXATO:
{
  "meta": {
    "title": "string",
    "objective": "string",
    "style": "string"
  },
  "slides": [
    {
      "id": "s1",
      "role": "cover",
      "headline": "string",
      "body": "string",
      "bullets": [],
      "footer": "string opcional",
      "imagePrompt": "string opcional",
      "notes": "string opcional"
    }
  ]
}
`.trim();
}
