# Amene — Landing page com casa 3D · Design

Data: 2026-11-16 · Status: aguardando aprovação do cliente

## 1. Intenção

A Amene é um escritório de arquitetura de interiores residenciais. O site é a vitrine do escritório. Ele precisa impressionar no nível dos sites premiados no Awwwards e transformar a visita em contato comercial.

A peça central é um projeto real do escritório, um apartamento com cozinha integrada, living, lavabo e quartos (30 fotos em `folders/`), apresentado como uma **maquete 3D navegável**. O visitante explora o projeto, vê as fotos reais de cada cômodo e sai do site por um canal de contato da Amene.

**Por quê:** mostrar a capacidade do escritório de um jeito que nenhum concorrente local mostra, e gerar leads.

**Público (suposição a confirmar):** pessoas e famílias de padrão médio-alto a alto que estão comprando ou reformando um imóvel, no Brasil. Idioma: português (pt-BR).

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Abertura cinematográfica e memorável, seguida de uma maquete 3D interativa do projeto.
- Levar o visitante a uma ação externa: WhatsApp (principal) ou Instagram (secundário).
- SEO técnico completo: indexável, rápido e com dados estruturados.
- Preparado para receber novos projetos depois.

**Não-objetivos (agora)**
- Painel administrativo (CMS), blog e versão em inglês.
- Configurador ou orçamento automático.
- Seção própria de materiais (descartada pelo cliente).

**Anti-objetivos (o que faria o projeto fracassar mesmo funcionando)**
- 3D com cara de desenho animado ou de jogo. A estética tem que ser de render de arquitetura.
- Site bonito mas lento, que trava no celular ou demora a mostrar conteúdo.
- Animação que impede a pessoa de chegar ao contato. Tudo pode ser pulado.
- Visual que pareça template ou cópia de outro site.

## 3. Restrições

- Hospedagem na **Vercel**.
- O **modelo 3D real ainda não existe do nosso lado**. O cliente vai pedir ao escritório os itens abaixo. Até lá, o site é construído com substitutos (ver §9).
  - Modelo do apartamento (.skp/.rvt/.max/.blend/.fbx/.obj) com texturas
  - Planta baixa com cotas e pé-direito
  - Renders, se existirem
  - Lista de materiais
  - Logo em vetor e fontes da marca
  - Textos institucionais, equipe, endereço, número de WhatsApp, Instagram, CNPJ/CAU e depoimentos
- As fotos originais têm 10 a 17 MB e até 6240 px. Precisam passar por um pipeline de otimização.
- Celular é cidadão de primeira classe. O 3D precisa rodar bem em celulares intermediários.
- Acessibilidade: respeitar `prefers-reduced-motion`, navegação por teclado e textos alternativos.

## 4. Abordagens consideradas

| | Escolha | Por quê |
|---|---|---|
| **A. Next.js (App Router) + React Three Fiber + GSAP/ScrollTrigger + Lenis** | ✅ **escolhida pelo cliente** | Nativo na Vercel, páginas pré-renderizadas para SEO, `robots`/`sitemap`/metadados embutidos, 3D integrado à interface React, padrão dos sites premiados. Custo: mais JavaScript, compensado carregando o 3D sob demanda. |
| B. Astro + three.js puro | descartada | Mais leve, mas transições e integração 3D/interface no nível pretendido dariam muito mais trabalho manual. |
| C. Página única só com three.js (Vite) | descartada | SEO fraco, porque o Google veria quase nada. |

**Realismo do 3D:** foi escolhida uma solução híbrida.
- A **abertura** será um **vídeo pré-renderizado no Blender (Cycles)** a partir do modelo do escritório, porque a luz em movimento do nascer do sol não pode ser pré-calculada para tempo real.
- A **maquete interativa** roda em tempo real com **iluminação pré-calculada (baked lightmaps)**, em duas versões: manhã e noite.
- O último quadro do vídeo coincide com o enquadramento inicial da maquete, para a troca passar despercebida.

## 5. Conceito: "um dia na casa"

O site inteiro acontece ao longo de um dia. A abertura é o amanhecer, e a rolagem avança o horário: manhã no topo, tarde dourada no meio, anoitecer no contato. A paleta de fundo e de destaque interpola suavemente entre estados de luz conforme o progresso da rolagem, de forma sutil e sem comprometer a legibilidade.

Paleta-base extraída das fotos: off-white, madeira freijó, pedra natural, terracota e verde-sálvia. A tipografia final depende das fontes da marca. Se não houver, o construtor propõe.

## 6. Experiência — página inicial (`/`)

### 00 · Abertura
1. Tela preta.
2. Vídeo do amanhecer dentro do apartamento, com cerca de 8 a 10 s.
3. As letras **A · M · E · N · E** caem do céu uma a uma, com física leve e peso, por cima do vídeo.
4. As letras se encaixam formando o logo, vem um clarão branco e o conteúdo é revelado.
5. A cena termina na maquete 3D (seção 01), já carregada por trás.

Regras (decisões do construtor, ver §11):
- Botão **"Pular"** visível desde o início.
- A versão completa toca só **na primeira visita da sessão**. Nas visitas seguintes, vai uma versão curta: só o logo e o clarão.
- Com `prefers-reduced-motion`: sem queda de letras. O logo aparece com um fade e o vídeo é substituído por um quadro estático.
- O conteúdo HTML da página existe desde o primeiro byte, para SEO e para leitores de tela. A abertura é uma camada por cima.

### 01 · A casa (maquete 3D)
Interação baseada no protótipo "Casa Aurora" que o cliente aprovou (referência de comportamento, não de estética). O código foi colado na conversa de design e não está no repositório. Os comportamentos que valem estão descritos abaixo:
- Câmera orbital em coordenadas esféricas (alvo, raio, ângulos), com limites de inclinação para não passar por baixo do piso.
- Ir até um cômodo é uma interpolação de cerca de 1,6 s com easing in-out cúbico do alvo, do raio e dos ângulos, sempre pelo caminho angular mais curto.
- Depois de cerca de 7 s sem interação na visão geral, a câmera volta a girar sozinha, devagar.
- Paredes externas voltadas para a câmera (produto escalar da normal com a direção da câmera > 0,3) caem para cerca de 15% de opacidade com transição suave.
- Os rótulos dos cômodos são elementos HTML projetados da posição 3D e aparecem só na visão geral.
- **Decisão do construtor:** a rolagem do mouse rola a página, não dá zoom. O zoom fica na pinça (celular), em Ctrl+roda ou em botões +/−. A rolagem passa pela seção e não controla a câmera.
- **Decisão do construtor:** a luz da maquete não acompanha o horário da rolagem. Ela começa em "manhã" e muda só pelo botão dia/noite, carregando a versão noturna sob demanda.

Comportamento em tópicos:
- Visão de maquete do apartamento inteiro, de cima e sem forro, girando devagar quando ninguém interage.
- Paredes do lado da câmera ficam transparentes, para ver dentro dos cômodos.
- Rótulos flutuantes com o nome de cada cômodo. Clicar faz a câmera voar até ele.
- Barra de navegação com os cômodos (Living, Cozinha, Lavabo, Suíte, Quartos… conforme a planta real).
- Alternância **dia/noite** entre as duas versões de iluminação.
- Ao abrir um cômodo, aparece um **painel com 3 a 4 fotos reais** daquele ambiente e uma descrição curta. O mapeamento foto → cômodo está no Apêndice A.
- Link "Ver projeto completo" leva para a página do projeto.
- Celular: arrastar com um dedo para girar e pinça para zoom. Os rótulos viram uma lista inferior. Qualidade gráfica adaptativa.
- Sem WebGL ou em aparelho muito fraco: imagem estática da maquete e grade de fotos por cômodo.
- Ficam de fora do protótipo de referência: telhado de telha, jardim, árvores, fumaça e boneco andando.

### 02 · Manifesto
Uma frase grande sobre a filosofia do escritório, com as palavras acendendo conforme a rolagem. O texto vem do escritório.

### 03 · Projetos
Por enquanto, o projeto atual em destaque, com imagem, nome e link. A estrutura já aceita uma lista. O layout para vários projetos será definido quando houver mais de um.

### 04 · Processo
As etapas reais de trabalho do escritório (ex.: briefing → estudo → projeto executivo → acompanhamento de obra), em sequência. Os textos vêm do escritório.

### 05 · Estúdio
Quem são, cidade/região de atuação e fotos da equipe. Depoimentos de clientes, se existirem.

### 06 · Contato (anoitecer)
- **Mini-formulário:** nome, tipo de projeto (residencial completo, ambiente específico, comercial, outro), cidade e metragem aproximada.
- Ao enviar, abre o **WhatsApp** (`https://wa.me/<número>?text=...`) com uma mensagem pronta contendo as respostas. Nada é armazenado no nosso servidor.
- Validação ao sair do campo, com mensagens que orientam sem culpar o usuário.
- O Instagram fica como ação secundária.
- Um botão flutuante discreto de WhatsApp aparece depois da abertura em todas as páginas.

### Rodapé
Endereço, redes, CNPJ/CAU e link para a política de privacidade.

## 7. Página do projeto (`/projetos/[slug]`)
- Uma página por projeto, gerada estaticamente a partir de um arquivo de conteúdo.
- Conteúdo: nome, local, metragem, ano, texto do conceito, cômodos com fotos em layout editorial, ficha técnica, chamada para o contato e link para o próximo projeto.
- A maquete 3D pode aparecer também aqui, em versão compacta (decisão do construtor).
- Transição animada entre a home e a página do projeto.

## 8. SEO e desempenho
- Metadados por página via API do Next (título, descrição, canonical e Open Graph/Twitter com imagem gerada).
- `app/robots.ts` e `app/sitemap.ts`.
- Dados estruturados JSON-LD: `ProfessionalService`/`LocalBusiness` para o escritório (endereço, telefone, redes) e `CreativeWork` + `ImageObject` para cada projeto.
- `lang="pt-BR"`, HTML semântico, um único `h1` por página e `alt` descritivo em todas as fotos.
- Imagens via `next/image` (AVIF/WebP, tamanhos responsivos). Fontes via `next/font`.
- Metas: Lighthouse ≥ 90 em Performance (celular), 100 em SEO e ≥ 95 em Acessibilidade. LCP < 2,5 s.
- O 3D e o vídeo carregam sob demanda e não bloqueiam o primeiro conteúdo.
- Vercel Analytics, com evento de conversão no envio do formulário e no clique em WhatsApp/Instagram.

## 9. Pipeline de assets e fases

**Decisões do cliente:**
- **A Fase 1 vai ao ar.** Ela é o lançamento, então os substitutos precisam ter qualidade de publicação: maquete com cara de render de arquitetura, nada de blocos de rascunho. A Fase 2 é uma troca de materiais posterior, sem mudar a estrutura.
- **Fase 2 feita por script no Blender** (Python/bpy), aceitando realismo um pouco menor que o de um artista 3D. Se o modelo do escritório não servir ou não existir, a maquete da Fase 1 é refinada e a abertura continua em tempo real.
- **Sem data de lançamento definida.**
- **O proprietário autorizou** publicar a planta, a maquete navegável e as informações do projeto.

**Fase 1 — tudo funcionando com substitutos (vai ao ar)**
- Maquete provisória modelada a partir das fotos (disposição estimada dos cômodos), com texturas recortadas das fotos. Ela vai ao ar, então precisa de geometria arredondada, mobiliário fiel às fotos, sombras suaves e pós-processamento leve (ex.: oclusão de ambiente). Se a planta baixa chegar antes, a disposição passa a segui-la.
- Abertura provisória com o amanhecer em tempo real (como no protótipo A), no lugar do vídeo.
- Logo provisório em texto. Textos provisórios claramente marcados.
- Fotos otimizadas a partir dos originais (script de conversão).

**Fase 2 — assets reais**
- Modelo do escritório → Blender: limpeza, materiais e bake de luz (manhã e noite) → glTF com Draco/Meshopt e texturas KTX2.
- Renderização do vídeo de abertura no Blender, com versões desktop e celular.
- Troca dos substitutos sem mudar a estrutura do código.

## 10. Estrutura de conteúdo
- Projetos em arquivos locais (`content/projetos/<slug>/` com metadados + fotos).
- Dados do escritório (contatos, redes, endereço) em um único arquivo de configuração.
- Um CMS fica para o futuro, quando houver vários projetos.

## 11. Decisões tomadas pelo construtor (o cliente pode revisar)
- Abertura com botão "Pular" e versão completa só na primeira visita da sessão.
- Sem trilha sonora na abertura.
- Formulário só monta a mensagem do WhatsApp. Não guarda dados, o que evita obrigações de LGPD além da política de privacidade básica.
- Botão flutuante de WhatsApp.
- Slug provisório do projeto até o escritório informar o nome.

## 12. Deixado ao construtor
- Tipografia (se a marca não tiver fontes), espaçamentos e grid.
- Coreografia exata das animações e curvas de easing.
- Bibliotecas auxiliares (ex.: `@react-three/drei`, `zustand`) e organização das pastas.
- Níveis de qualidade gráfica por dispositivo.

## Apêndice A — Fotos por cômodo (preliminar)
| Cômodo | Fotos |
|---|---|
| Cozinha / jantar | IMG_4592, 4598, 4607, 4643, 4646, 5050 |
| Living | IMG_4631, 4687, 4712, 4736, 4748, 4759, 4763, 5034 |
| Lavabo | IMG_4783 |
| Suíte casal (cabeceira em treliça, verde) | IMG_4796, 4810, 4823 |
| Quarto de solteiro (duas camas) | IMG_4837, 4853, 4866, 4880, 4963 |
| Suíte (cabeceira ripada, pendentes de palha) | IMG_4924 |
| Quarto (escrivaninha curva, ripado vertical) | IMG_4943, 4946, 4951 |
| Quarto (espelho orgânico, escrivaninha) | IMG_5055, 5061, 5070 |

As fotos IMG_5034 e IMG_5050 têm pessoas em movimento. São boas para a seção Estúdio ou para dar vida às páginas.
