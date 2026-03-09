# Template Normalizers

Cada template tem seu próprio arquivo em:

- `templates/streetwearPro.ts`
- `templates/luxuryMinimal.ts`
- `templates/microBlogBold.ts`
- `templates/editorial3D.ts`

## Como adicionar um novo template

1. Crie um novo arquivo em `templates/<novoTemplate>.ts`.
2. Exporte uma função `build<NomeDoTemplate>Template(params)` que retorne `CarouselElement[]`.
3. Registre o builder em `index.ts` (`TEMPLATE_BUILDERS`).
4. Adicione o template em `functions/src/ai/templateCatalog.ts` (id, label, description, defaultTheme e overrides).
5. Adicione o template no catálogo frontend em `frontend/src/templates/templateCatalog.ts`.

## Contrato do builder

O builder recebe `TemplateBuildParams` (em `shared.ts`), com:

- `templateId`
- `slideIndex` / `slideCount`
- `role` (`hook` | `content` | `cta`)
- `copy` (`heading`, `support`, `extras`)
- `palette`
- `creativeDirection`
- `theme`

E deve retornar elementos compatíveis com o schema de carrossel.
