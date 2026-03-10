export function buildCarouselGeneratorPrompt(params: {
  userPrompt: string;
  selectedTemplateLabel: string;
}) {
  const { userPrompt, selectedTemplateLabel } = params;

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

TEMPLATE VISUAL ESCOLHIDO:
${selectedTemplateLabel}

REGRAS:
- use 4 a 6 slides
- slide 1 deve ser role = "cover"
- slide final deve ser role = "cta"
- slides do meio devem ser role = "content"
- headline curta e forte
- body claro, específico e utilizável
- bullets opcionais, mas quando usar mantenha 3 a 5 itens
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
