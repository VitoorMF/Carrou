# Export e Previews

## Export

## Motivação

O export no navegador foi abandonado para arquivos finais porque dependia de:

- CORS do Storage
- `toDataURL()` do Konva
- comportamento do browser

Isso gerava falhas com canvas contaminado por imagens remotas.

## Abordagem atual

O export final roda no backend em:

- `functions/src/exportCarouselZip.ts`

Ele:

1. recebe `projectId`
2. valida autenticação
3. lê `renderCarousel`
4. aplica identidade do `profileCard`
5. renderiza cada slide em SVG
6. converte para PNG com `sharp`
7. devolve:
   - um PNG, quando `slideIndex` é informado
   - um ZIP, quando exporta o carrossel inteiro

## Endpoints usados pelo frontend

No `EditPage`:

- `Exportar PNG` chama o backend com `slideIndex`
- `Baixar todos` chama o backend sem `slideIndex`

## Tradeoff atual

Há dois renderers diferentes:

1. renderer visual do editor
2. renderer server-side para export

Isso elimina problemas de CORS, mas pode criar pequenas diferenças de:

- quebra de linha
- tipografia
- crop de imagem
- detalhes finos de alinhamento

Essas diferenças devem ser tratadas no renderer backend, não no browser.

## Previews do dashboard

Hoje o dashboard usa o próprio `Canvas` em modo miniatura para mostrar o slide 1.

Vantagem:

- fidelidade alta com o editor

Desvantagem:

- custo maior de render para muitos projetos

## Recomendação de escala

Para poucos projetos:

- preview vivo com `Canvas` é aceitável

Para muitos projetos:

- gerar thumbnail persistida do slide 1
- salvar algo como `previewUrl`
- dashboard renderizar apenas imagem

## Estrutura futura recomendada

1. `renderCarousel` continua como contrato principal
2. export backend continua como render final
3. thumbnail do slide 1 passa a ser gerada e persistida
4. dashboard deixa de montar muitos canvases simultaneamente
