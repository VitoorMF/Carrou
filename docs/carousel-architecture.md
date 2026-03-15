# Arquitetura do Carrossel

## Objetivo

Este documento descreve o fluxo atual de geração, persistência, renderização e export do carrossel.

O princípio central é:

- o backend é responsável por decidir o layout final
- o frontend renderiza e aplica edições limitadas sobre esse layout

## Pipeline de dados

Fluxo nominal:

1. usuário envia `prompt` e opcionalmente `templateId`
2. `generateCarousel` chama o generator de conteúdo
3. o conteúdo é convertido em draft sem layout
4. o template oficial é aplicado no backend
5. o projeto é salvo com o render final
6. o editor lê esse render e monta o canvas
7. o export final roda no backend

## Campos persistidos

### `ai.raw`

Payload bruto gerado a partir do prompt.

Contém:

- `meta`
- `slides`
- texto e estrutura editorial

Não é a fonte de verdade do render.

### `ai.normalized`

Versão normalizada do conteúdo.

Serve como compatibilidade e base histórica para:

- palette original
- dados legados
- debug

Não deve ser usada como render principal do editor quando `renderCarousel` existir.

### `renderCarousel`

Contrato principal de render.

Contém:

- `meta`
- `slides`
- `layers.background`
- `layers.atmosphere`
- `layers.content`
- `layers.ui`

Este é o campo que deve ser tratado como fonte de verdade visual.

### `slides`

Espelho legado do render para compatibilidade com rotas e funções antigas.

Enquanto existir, ele deve permanecer consistente com `renderCarousel.slides`.

## Template engine

Templates oficiais vivem em:

- `shared/templateEngine/templates/`

Render compartilhado vive em:

- `shared/templateEngine/renderCarousel.ts`

Objetivo dessa camada:

- aplicar composição visual oficial
- evitar drift entre backend e playground

## Regras de arquitetura

### Fonte de verdade

- visual oficial: `renderCarousel`
- conteúdo histórico/legado: `ai.normalized` e `slides`

### O que o frontend não deve fazer automaticamente

- auto-layout ao abrir projeto
- reflow implícito do template
- recomposição automática da estrutura do slide

### O que o frontend pode fazer

- mover `text` e `image`
- editar texto
- trocar paleta
- escolher imagem local
- pedir geração de imagem IA

Essas alterações operam sobre o render já pronto.

## Profile card

O `profileCard` é um elemento do render.

Hoje o render salvo pode conter placeholders como:

- `Username`
- `Cargo/função na empresa`

No frontend e no export, esses placeholders são enriquecidos em tempo de render usando o perfil do usuário:

- `displayName`
- `specialization`
- `avatarUrl`

Isso permite que projetos antigos usem dados atuais do usuário sem regenerar o carrossel inteiro.

## Riscos conhecidos

### Convivência entre modelos antigos e novos

Hoje coexistem:

- `renderCarousel`
- `slides`
- `ai.normalized`

Isso é útil para compatibilidade, mas aumenta a chance de confusão se não for mantido documentado.

### Dois renderers

Existem dois renderers diferentes:

1. `Canvas.tsx` no frontend
2. renderer SVG/Sharp no backend para export

Eles devem permanecer conceitualmente alinhados, mas não são o mesmo código.

## Próxima consolidação recomendada

1. formalizar `renderCarousel` como contrato oficial
2. documentar quando `slides` ainda é necessário
3. considerar persistir explicitamente:
   - `basePalette`
   - modo do `profileCard`
