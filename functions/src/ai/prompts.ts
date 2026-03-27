export function buildCarouselGeneratorPrompt(params: {
  userPrompt: string;
  selectedTemplateLabel: string;
}) {
  const { userPrompt, selectedTemplateLabel } = params;

  return `
Você cria a ESTRUTURA DE CONTEÚDO de um carrossel de Instagram de alto engajamento.

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

---

ETAPA 1 — ANÁLISE (interna, não retorne no JSON)
Antes de escrever, analise silenciosamente:
1. NICHO: Qual nicho? (ex: imobiliário, fitness, finanças, saúde, moda, educação, tech, gastronomia)
2. FRAMEWORK: Qual estrutura serve melhor o objetivo?
   - GANCHO + VIRADA + CTA → carrosséis virais, provocações, revelações inesperadas
   - PAS (Problema → Agitação → Solução) → conteúdo educativo sobre dores reais
   - AIDA (Atenção → Interesse → Desejo → Ação) → lançamentos, ofertas, conversão direta
3. TOM: Urgente? Curioso? Autoritário? Empático?

---

ETAPA 2 — CONSTRUÇÃO DOS SLIDES

SLIDE 1 (role: "cover") — GANCHO:
- Uma única frase que para o scroll
- Provoca curiosidade, dor ou controvérsia — específico ao nicho detectado
- Nunca genérico. Nunca "Como fazer X". Nunca "Dicas de Y"
- Sem ponto final. Direto ao ponto.
- Padrões que funcionam:
  → "Você está [fazendo X] e perdendo [Y] sem saber"
  → "[N] coisas que [persona] não te conta sobre [tema]"
  → "Por que [crença comum] é um erro caro"
  → "O que acontece quando você [ação inesperada]"
- body do cover: reforça a promessa do headline, 1 frase, aumenta a tensão

SLIDES DO MEIO (role: "content") — ENTREGA:
- Cada slide = 1 insight concreto e acionável
- headline: afirmação direta — não título de artigo, não pergunta retórica
- body: explica o insight em 1-2 frases sem rodeios, com consequência real
- bullets (quando usar): máx 4 itens, cada um específico e com impacto tangível
- Proibido: "é importante", "lembre-se de", "não se esqueça", "no mundo atual"

SLIDE FINAL (role: "cta") — AÇÃO ESPECÍFICA:
- CTA nunca genérico — sempre específico ao nicho detectado
- Referências por nicho:
  → Imobiliário: "Fala comigo antes de assinar qualquer contrato"
  → Fitness/Saúde: "Salva esse post e faz hoje à noite"
  → Finanças: "Baixa a planilha gratuita (link na bio)"
  → Educação/Infoproduto: "Manda isso pra quem precisa ver"
  → Consultoria/B2B: "Encaminha pro seu time agora"
  → E-commerce: "Garante o seu antes de acabar"
- headline do cta: frase de fechamento com impacto emocional, não "Entre em contato"
- body do cta: instrução direta — o que exatamente fazer agora

---

REGRAS GERAIS:
- use 4 a 6 slides
- slide 1 deve ser role = "cover"
- slide final deve ser role = "cta"
- slides do meio devem ser role = "content"
- escreva em pt-BR
- cada frase deve ter função — se não engaja ou converte, corta
- pense como redator de performance, não criador de conteúdo genérico
- bullets opcionais, mas quando usar mantenha 3 a 4 itens no máximo

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
