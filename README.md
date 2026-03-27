# Carrou

Documentação principal do fluxo atual:

- [Arquitetura do carrossel](./docs/carousel-architecture.md)
- [Contrato do editor](./docs/editor-contract.md)
- [Export e previews](./docs/export-and-previews.md)
- [Billing e créditos](./docs/billing-schema.md)

## Resumo rápido

Fluxo principal:

1. Backend recebe `prompt` + `templateId`
2. Gera conteúdo bruto (`ai.raw` / `ai.content`)
3. Normaliza (`ai.normalized`)
4. Monta o render final (`renderCarousel`)
5. Frontend renderiza e edita a partir de `renderCarousel`
6. Export final roda no backend

Fonte de verdade visual:

- `renderCarousel`

Compat legada ainda existente:

- `slides`
- `ai.normalized`

## Pastas mais importantes

- `functions/src/generateCarousel.ts`: geração do projeto
- `functions/src/exportCarouselZip.ts`: export PNG/ZIP no backend
- `shared/templateEngine/`: templates compartilhados
- `frontend/src/pages/edit_page/EditPage.tsx`: editor principal
- `frontend/src/editor/canvas/Canvas.tsx`: renderer visual do editor
- `frontend/src/pages/dashboard_page/DashboardPage.tsx`: listagem de projetos e preview
