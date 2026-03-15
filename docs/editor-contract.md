# Contrato do Editor

## Papel do editor

O editor não é um motor de layout.

Ele deve:

- ler o render vindo do backend
- exibir o canvas
- permitir edições limitadas
- persistir essas edições

Ele não deve reinventar o template.

## Fonte de leitura

Prioridade de leitura no `EditPage`:

1. `renderCarousel`
2. `slides`
3. `ai.normalized`
4. `ai.raw`

Na prática, projetos novos devem usar `renderCarousel`.

## Estado principal

### `serverCarousel`

Snapshot do render usado como fonte do canvas.

### `slides`

Representação simplificada para o painel/editor local.

Usada para:

- seleção
- labels do inspector
- campos editáveis

### Estado de UI

Inclui:

- `selectedElementId`
- `activeSlideId`
- `zoom`
- `statusMessage`
- `errorMessage`

## Elementos editáveis

Atualmente:

- `text`
- `image`

Outros elementos são tratados como parte fixa do template:

- `background`
- `shape`
- `glow`
- `path`
- `gradientRect`
- `profileCard`

## Edições suportadas

### Texto

- alterar conteúdo
- mover posição
- ajustar `x`
- ajustar `y`

Persistência:

- salva com debounce

### Imagem

- mover posição
- ajustar `x`
- ajustar `y`
- gerar com IA
- escolher imagem da galeria

Persistência:

- drag salva no fim
- galeria envia arquivo ao Storage e persiste URL

### Paleta

Modos:

- presets
- avançado

Ao alterar a paleta:

- `meta.palette` é atualizado
- elementos do render são recoloridos localmente
- alteração é persistida

## Original palette

`Original` não significa “última paleta salva”.

Ele tenta representar a paleta-base do projeto, vinda preferencialmente de:

- `ai.normalized.meta.palette`

Fallback:

- paleta atual do render, caso o dado base não exista

## Autosave

Persistência atual:

- posição final no `dragEnd`
- texto com debounce
- coordenadas com debounce
- paleta com debounce
- imagem da galeria salva imediatamente

Destino:

- `renderCarousel`
- `slides`
- `updatedAt`

## Inspector

O inspector deve ser orientado a tarefa, não a debug interno.

Com seleção:

- mostra ajustes do elemento

Sem seleção:

- mostra paleta global

Lista lateral:

- mostra apenas elementos manipuláveis

## Limites intencionais

O editor não tenta ser um Canva completo.

Limites desejados:

- manter consistência visual do template
- permitir customização suficiente
- evitar quebrar composição

## Próximas melhorias naturais

1. separar `EditPage` em hooks menores
2. adicionar status visual de autosave
3. explicitar melhor quais campos do projeto são base e quais são derivados
