export function buildCarouselGeneratorPrompt(params: {
  userPrompt: string;
  templateLabel: string;
  tone: string;
  objective: string;
}) {
  const { userPrompt, templateLabel, tone, objective } = params;

  return `
Você cria a estrutura textual de um carrossel de Instagram.

IMPORTANTE:
- O design visual NÃO é sua responsabilidade.
- O sistema vai aplicar o template e o layout depois.
- Você deve gerar APENAS conteúdo textual em JSON.
- Saída em JSON puro, sem markdown, sem comentários.

OBJETIVO:
- criar um carrossel claro, útil e publicável
- entre 4 e 6 slides
- slide 1 = hook forte
- slides do meio = conteúdo prático
- último slide = CTA

REGRAS DE TEXTO:
- headline curta e forte
- texto de apoio específico, sem enrolação
- evite frases genéricas demais
- evite clichês como "Descubra", "Transforme", "Conheça", "Aprenda tudo sobre"
- escreva em pt-BR
- pense em conteúdo para Instagram que gere autoridade

CONTEXTO:
- template base: ${templateLabel}
- tom esperado: ${tone}
- objetivo principal: ${objective}

PROMPT DO USUÁRIO:
${userPrompt}

FORMATO EXATO DE SAÍDA:
{
  "meta": {
    "title": "string",
    "objective": "string",
    "style": "string"
  },
  "slides": [
    {
      "id": "s1",
      "elements": [
        {
          "id": "bg-1",
          "type": "background",
          "x": 0,
          "y": 0,
          "width": 1080,
          "height": 1350,
          "fill": "#101010",
          "opacity": 1
        },
        {
          "id": "title-1",
          "type": "text",
          "x": 72,
          "y": 180,
          "text": "headline do slide",
          "fill": "#FFFFFF",
          "fontSize": 72,
          "fontFamily": "Sora",
          "fontStyle": "bold",
          "width": 936,
          "align": "left",
          "lineHeight": 1.0,
          "letterSpacing": -1,
          "opacity": 1
        },
        {
          "id": "support-1",
          "type": "text",
          "x": 72,
          "y": 400,
          "text": "texto de apoio específico",
          "fill": "#D1D5DB",
          "fontSize": 28,
          "fontFamily": "Manrope",
          "fontStyle": "normal",
          "width": 900,
          "align": "left",
          "lineHeight": 1.35,
          "letterSpacing": 0,
          "opacity": 1
        }
      ]
    }
  ]
}

RESTRIÇÕES IMPORTANTES:
- use APENAS elementos dos tipos "background" e "text"
- não use image, path, glow, gradientRect, glassCard, backgroundImage ou noise
- não invente SVGs
- use de 4 a 6 slides
- todos os slides devem vir prontos no JSON
`.trim();
}
