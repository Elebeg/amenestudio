# Estilo ilustrado (A) — abertura e maquete · Design curto

Data: 2026-11-23 · Status: aprovado pelo cliente (2026-11-23)

## Intenção
O cliente quer que a abertura (e, por consistência, a maquete da home) deixe de parecer um render e passe a uma **"realidade ilustrada"**: próxima do real, apresentável, levemente cartunesca — "não muito". Referência de tom: ilustrações de revistas de arquitetura/interiores.

## Objetivos
- Luz em **poucas faixas suaves** (3–4 tons) em vez de degradê fotográfico.
- **Sombras coloridas**: sombra puxa para lilás/azul frio; luz para dourado quente (mais forte no amanhecer).
- **Contorno fino e quente** nas quinas de paredes e móveis (linha fina, cor madeira escura, não preta).
- Pedra, madeira, bouclê continuam **reconhecíveis** — texturas simplificadas (menos ruído, cores levemente posterizadas), não removidas.
- Mesmo estilo na abertura (amanhecer) e na maquete interativa (dia e noite).

## Não-objetivos / anti-objetivos
- Nada de cores saturadas, cel-shading duro de desenho animado, contorno preto grosso.
- Não mudar planta, interação, câmera, conteúdo.
- Não piorar desempenho — o estilo deve ficar **igual ou mais leve** (sai o N8AO; entra um passe de contorno).

## Abordagens consideradas
- **A. Ilustração arquitetônica suave** — escolhida pelo cliente.
- B. Maquete de estúdio (argila/papel, tilt-shift) — descartada.
- C. Aquarela/croqui — descartada (distante demais do real).

## Como (decisões do construtor, revisáveis)
- Um **fábrica de materiais estilizados** única (shader estendido via `onBeforeCompile` sobre `MeshStandardMaterial`): quantiza a iluminação difusa em faixas com transição suave e aplica rampa de cor sombra→luz. Usada pelas duas cenas, mantendo materiais por instância.
- **Contorno** por pós-processamento de bordas (profundidade + normais) com espessura ~1px em 1x DPR, cor `#6b4e3a` a ~60% — um passe só, sem N8AO.
- Texturas: versão "ilustrada" gerada no script de texturas (suavização + leve posterização), mantendo as originais para a Fase 2.
- Chave de configuração `site.visual.estilo: 'ilustrado' | 'realista'` (padrão `ilustrado`) para poder voltar ao realista sem retrabalho.
- Nível de qualidade `low`: mantém faixas e cores, desliga o contorno.

## Verificação
- Screenshots da abertura (0,5/3/6/7,5/9,5 s) e da maquete (visão geral, living, noite) para o cliente aprovar o visual antes de juntar.
- Testes existentes continuam passando; testes unitários para a rampa/quantização (função pura).
- Lighthouse da home medido antes/depois.
