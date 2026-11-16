# Amene Landing — Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar a landing page da Amene (abertura com amanhecer + letras, maquete 3D interativa do apartamento, seções institucionais, página do projeto, formulário → WhatsApp, SEO completo) usando assets provisórios trocáveis na Fase 2.

**Architecture:** Next.js App Router com páginas estáticas (SSG) — todo o conteúdo existe em HTML desde o primeiro byte; a abertura e o 3D são camadas client-side carregadas sob demanda. A maquete é **dirigida por dados** (`layout.ts` descreve cômodos/paredes/aberturas) para que a Fase 2 troque a geometria procedural por um GLB sem mudar a interação. Lógica pura (paleta do dia, câmera, URL do WhatsApp, máquina da abertura, SEO) fica em `src/lib`/`src/three/*Math.ts` com testes unitários; comportamento de página é coberto por Playwright.

**Tech Stack:** Node 22 · Next 16.4 · React 19.3 · TypeScript · three 0.187 · @react-three/fiber 9.8 · @react-three/drei 10.7 · @react-three/postprocessing 3.2 · gsap 3.15 + @gsap/react 2.1 · lenis 1.3 · zod 4.6 · vitest 5.1 · @playwright/test 1.65 · sharp 0.35 · @vercel/analytics 2.0

**Spec:** `docs/superpowers/specs/2026-11-16-amene-landing-design.md`

## Global Constraints

- Idioma único pt-BR; `<html lang="pt-BR">`.
- Deploy na Vercel; nenhum backend próprio, nenhum dado de visitante armazenado.
- Todo texto/contato do escritório ainda não fornecido vem de `src/config/site.ts` e é marcado `placeholder: true`; nada de lorem ipsum — textos provisórios plausíveis e identificáveis.
- Fotos originais em `/folders/` (fora do git); o site só usa as versões geradas em `public/projetos/`.
- Toda animação respeita `prefers-reduced-motion` (sem queda de letras, sem rolagem suave, sem auto-rotação).
- Abertura sempre pulável (botão "Pular" + tecla Esc) e o conteúdo HTML existe por baixo dela.
- Roda do mouse rola a página; zoom do 3D só por pinça, Ctrl+roda ou botões +/−.
- Luz da maquete: começa "manhã", muda só pelo botão dia/noite; não segue a rolagem.
- Metas: Lighthouse mobile Performance ≥ 90, SEO 100, Acessibilidade ≥ 95; LCP < 2,5 s.
- Estética: render de arquitetura — nada de cores saturadas, cartoon, glassmorphism ou emoji na interface.
- Paleta-base das fotos: off-white `#EFEBE5`, freijó `#B07B4F`, pedra `#BFB6A8`, terracota `#B4532A`, sálvia `#8A9A86`, tinta `#1C1916`.
- Commits pequenos, mensagem em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Número de WhatsApp ainda não fornecido** — o formulário não pode abrir um `wa.me` quebrado; deve mostrar "Contato direto em breve" + Instagram e não disparar evento de conversão. (Task 5)
2. **Acentos, quebras de linha, `&`, `#` e emoji nos campos** — a mensagem chega íntegra no WhatsApp. (Task 5)
3. **Sem WebGL / contexto perdido / aparelho fraco** — seção 01 mostra a imagem da maquete + grade de fotos por cômodo, sem erro no console. (Task 11)
4. **Visitante age durante a abertura** (rola, aperta Tab/Esc, recarrega no meio, tem reduced-motion) — nunca fica preso; conteúdo alcançável por teclado. (Task 12)
5. **Contraste em posições intermediárias da rolagem** — a paleta interpolada mantém texto ≥ 4.5:1 em todo `t ∈ [0,1]`, não só nos keyframes. (Task 3)

---

## Estrutura de arquivos

```
src/
  app/
    layout.tsx                 html pt-BR, fontes, providers, Analytics, JSON-LD do escritório
    page.tsx                   home: Intro + seções 01–06
    projetos/[slug]/page.tsx   página do projeto (SSG)
    robots.ts  sitemap.ts  opengraph-image.tsx  not-found.tsx
    globals.css                tokens CSS (variáveis do "dia")
  config/site.ts               dados do escritório (com placeholders)
  content/projetos/
    index.ts                   getProjects/getProject
    schema.ts                  zod do projeto
    apartamento-pedra/projeto.ts   dados do projeto atual (slug provisório)
  lib/
    daylight.ts  whatsapp.ts  seo.ts  analytics.ts  introMachine.ts  quality.ts
  components/
    providers/SmoothScroll.tsx    Lenis + GSAP ScrollTrigger
    daylight/DaylightController.tsx
    layout/Header.tsx Footer.tsx WhatsAppFab.tsx
    sections/Manifesto.tsx ProjetosDestaque.tsx Processo.tsx Estudio.tsx Contato.tsx
    lead/LeadForm.tsx
    intro/Intro.tsx IntroDawnScene.tsx FallingLetters.tsx
    house/HouseSection.tsx RoomNav.tsx RoomPanel.tsx HouseFallback.tsx
    project/ProjectGallery.tsx
  three/
    apartment/layout.ts        planta (dados)
    apartment/ApartmentModel.tsx  monta a partir do layout (procedural) ou GLB
    apartment/rooms/*.tsx      mobiliário por cômodo
    apartment/materials.ts     materiais PBR + texturas recortadas
    camera/cameraMath.ts       órbita esférica, tween, ângulo mais curto
    camera/OrbitRig.tsx  WallFader.tsx  RoomLabels.tsx  Lighting.tsx
scripts/
  optimize-photos.mjs  crop-textures.mjs
tests/unit/*.test.ts   tests/e2e/*.spec.ts
public/projetos/apartamento-pedra/*.webp   public/textures/*.webp
```

---

### Task 1: Base do projeto, configuração do escritório e testes

**Files:**
- Create: projeto Next em `d:\projetos\AmeneStudio` (sem sobrescrever `docs/`, `prototipos/`, `.gitignore`, `README.md`), `src/config/site.ts`, `vitest.config.ts`, `playwright.config.ts`, `tests/unit/site.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts), `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Produces: `site: SiteConfig` em `src/config/site.ts`:
  ```ts
  type SiteConfig = {
    name: 'Amene'; url: string; description: string;
    whatsapp: { number: string | null; placeholder: boolean };   // só dígitos com DDI, ex. "5547999999999"
    instagram: { handle: string; url: string; placeholder: boolean };
    address: { street: string; city: string; state: string; postalCode: string; placeholder: boolean };
    cnpj: string | null; cau: string | null;
    intro: { videoSrc: string | null };   // Fase 2 preenche
  }
  ```
  Valores iniciais: `whatsapp.number: null`, `url: 'https://amenestudio.vercel.app'` (provisório), demais com `placeholder: true`.
- Scripts npm: `dev`, `build`, `start`, `lint`, `test` (vitest run), `test:e2e` (playwright), `photos` (Task 2).

- [ ] **Step 1:** `npx create-next-app@16.4.6 tmp-app --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*" --use-npm`, mover o conteúdo para a raiz e apagar `tmp-app`. Instalar dependências das versões do Tech Stack (exatas, sem `^`).
- [ ] **Step 2: teste que falha** `tests/unit/site.test.ts`:
  ```ts
  it('whatsapp number is null or digits only with country code', () => {
    const n = site.whatsapp.number; expect(n === null || /^55\d{10,11}$/.test(n)).toBe(true) })
  it('instagram url matches handle', () => expect(site.instagram.url).toBe(`https://www.instagram.com/${site.instagram.handle}/`))
  ```
- [ ] **Step 3:** criar `site.ts`; `npm test` → PASS.
- [ ] **Step 4:** `layout.tsx` com `<html lang="pt-BR">` e duas fontes via `next/font/google` (uma de display e uma de texto). A escolha é do construtor, desde que não use Fraunces nem Inter, que são as do protótipo de referência. Registrar a escolha em comentário no `globals.css`. `page.tsx` com `<main>` e `<h1>Amene</h1>` provisório.
- [ ] **Step 5: e2e** `tests/e2e/smoke.spec.ts`: home responde 200, `html[lang=pt-BR]`, exatamente um `h1`. `npm run build && npm run test:e2e` → PASS (playwright `webServer: npm run start`).
- [ ] **Step 6:** commit `chore: base Next 16 com testes e configuração do escritório`.

---

### Task 2: Pipeline de fotos e texturas

**Files:**
- Create: `scripts/optimize-photos.mjs`, `scripts/crop-textures.mjs`, `scripts/lib/photo-plan.mjs`, `tests/unit/photo-plan.test.ts`
- Output (commitado): `public/projetos/apartamento-pedra/<id>.webp`, `src/content/projetos/apartamento-pedra/photos.generated.json`, `public/textures/{stone,wood,wood-dark}.webp`

**Interfaces:**
- Produces: `photos.generated.json`: `Array<{ id: string; src: string; width: number; height: number; blurDataURL: string }>` onde `id` é o nome sem `-HDR` e sem extensão (ex. `"IMG_4759"`), `src` = `/projetos/apartamento-pedra/IMG_4759.webp`.
- Produces: `photoId(filename: string): string` e `targetSize(w: number, h: number, maxEdge = 2400): {width:number;height:number}` em `scripts/lib/photo-plan.mjs`.

- [ ] **Step 1: teste que falha:**
  ```ts
  expect(photoId('IMG_4592-HDR.jpg')).toBe('IMG_4592'); expect(photoId('IMG_4759.jpg')).toBe('IMG_4759')
  expect(targetSize(6240, 4160)).toEqual({ width: 2400, height: 1600 })
  expect(targetSize(4160, 6240)).toEqual({ width: 1600, height: 2400 })
  expect(targetSize(1200, 800)).toEqual({ width: 1200, height: 800 })   // nunca amplia
  ```
- [ ] **Step 2:** implementar `photo-plan.mjs`; testes PASS.
- [ ] **Step 3:** `optimize-photos.mjs`: lê `folders/*.jpg`, aplica rotação EXIF (`sharp().rotate()`), redimensiona por `targetSize`, WebP qualidade 80, gera `blurDataURL` (16 px WebP base64), escreve o JSON ordenado por `id`. Script `npm run photos`.
- [ ] **Step 4:** rodar → 30 arquivos em `public/projetos/apartamento-pedra/`, cada um < 900 KB; JSON com 30 entradas. Verificar: `node -e "const a=require('./src/content/projetos/apartamento-pedra/photos.generated.json');console.log(a.length)"` → `30`.
- [ ] **Step 5:** `crop-textures.mjs` recorta de `IMG_4759.jpg` (6160×4107): pedra `(1240,360)-(2420,1760)` → 1024 px de largura; madeira do painel `(60,500)-(520,3400)` → 512×2048; gera também `stone-bump.webp` em tons de cinza. Saída em `public/textures/`.
- [ ] **Step 6:** commit `feat: pipeline de fotos e texturas do projeto`.

---

### Task 3: Paleta do "dia" guiada pela rolagem

**Files:**
- Create: `src/lib/daylight.ts`, `src/components/daylight/DaylightController.tsx`, `src/components/providers/SmoothScroll.tsx`, `tests/unit/daylight.test.ts`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces:
  ```ts
  type Palette = { bg: string; fg: string; muted: string; accent: string; line: string }  // hex #rrggbb
  const DAY_STOPS: Array<{ at: number; name: 'amanhecer'|'manha'|'tarde'|'anoitecer'; palette: Palette }>
  function paletteAt(t: number): Palette          // t fora de [0,1] é limitado
  function contrastRatio(a: string, b: string): number   // WCAG 2.x
  ```
  Stops: `amanhecer at 0` (bg `#EFEBE5`), `manha at .3`, `tarde at .65` (bg com viés dourado), `anoitecer at 1` (bg `#1C1916`, fg claro). Interpolação em OKLab.
- Produces: `<DaylightController />` escreve `--bg --fg --muted --accent --line` em `document.documentElement` conforme `ScrollTrigger` do `<main>` inteiro; `<SmoothScroll>` (Lenis, desligado com reduced-motion) expõe `useLenis()`.

- [ ] **Step 1: teste que falha:**
  ```ts
  it('returns exact stop palettes', () => expect(paletteAt(0)).toEqual(DAY_STOPS[0].palette))
  it('clamps', () => expect(paletteAt(-1)).toEqual(paletteAt(0)))
  it('keeps text contrast >= 4.5 at every 1% of scroll', () => {
    for (let i = 0; i <= 100; i++) { const p = paletteAt(i/100)
      expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5) } })
  ```
- [ ] **Step 2:** implementar; se a passagem claro→escuro violar contraste no meio, `fg` troca de lado no ponto em que o contraste do lado oposto passa a ser maior (não interpolar `fg` linearmente através do cinza médio). PASS.
- [ ] **Step 3:** CSS: `body{background:var(--bg);color:var(--fg)}` com valores iniciais = `paletteAt(0)`; controller + Lenis no layout. Com reduced-motion a paleta ainda muda (é cor, não movimento), mas sem transição suave.
- [ ] **Step 4:** commit `feat: paleta do dia guiada pela rolagem`.

---

### Task 4: Conteúdo do projeto e casca do site

**Files:**
- Create: `src/content/projetos/schema.ts`, `src/content/projetos/index.ts`, `src/content/projetos/apartamento-pedra/projeto.ts`, `src/components/layout/{Header,Footer,WhatsAppFab}.tsx`, `tests/unit/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type RoomId = 'cozinha'|'living'|'lavabo'|'suite-casal'|'quarto-solteiro'|'suite-ripada'|'quarto-escrivaninha'|'quarto-espelho'
  type Room = { id: RoomId; nome: string; descricao: string; fotos: string[] /* ids de photos.generated.json */; capa: string }
  type Projeto = { slug: string; nome: string; local: string; metragem: number | null; ano: number | null;
    conceito: string; capa: string; rooms: Room[]; ficha: Array<{rotulo:string; valor:string}>; placeholder: boolean }
  getProjects(): Projeto[]; getProject(slug: string): Projeto | undefined
  getPhoto(id: string): Photo   // lança Error se id não existe
  ```
- Rooms e fotos = Apêndice A do spec. `slug: 'apartamento-pedra'` (provisório).

- [ ] **Step 1: teste que falha:** schema valida o projeto; todo `fotos[]` e `capa` existe em `photos.generated.json`; nenhuma foto aparece em dois cômodos; as 30 fotos estão em algum cômodo (as 2 com pessoas — `IMG_5034`, `IMG_5050` — ficam em living/cozinha conforme Apêndice A); `getProject('nao-existe')` → `undefined`.
- [ ] **Step 2:** implementar; PASS.
- [ ] **Step 3:** Header (logo texto "AMENE" + links âncora: Casa, Projetos, Processo, Estúdio, Contato), Footer (endereço, Instagram, CNPJ/CAU quando não nulos, link `/privacidade`), `WhatsAppFab` (só renderiza quando `site.whatsapp.number` não é nulo; recebe `visible: boolean`). Criar `src/app/privacidade/page.tsx` com texto curto: o site não coleta dados; formulário apenas monta mensagem do WhatsApp; Vercel Analytics sem cookies.
- [ ] **Step 4:** commit `feat: modelo de conteúdo do projeto e casca do site`.

---

### Task 5: Formulário de lead → WhatsApp

**Files:**
- Create: `src/lib/whatsapp.ts`, `src/lib/analytics.ts`, `src/components/lead/LeadForm.tsx`, `tests/unit/whatsapp.test.ts`, `tests/e2e/lead.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  const TIPOS = ['Residencial completo','Ambiente específico','Comercial','Outro'] as const
  const leadSchema: z.ZodType<Lead>   // nome 2–80, tipo ∈ TIPOS, cidade 2–80, metragem: número 10–5000 ou vazio
  type Lead = { nome: string; tipo: typeof TIPOS[number]; cidade: string; metragem?: number }
  function buildLeadMessage(l: Lead): string
  function buildWhatsAppUrl(number: string | null, l: Lead): string | null   // null quando sem número
  function track(event: 'lead_whatsapp'|'click_instagram'|'click_whatsapp_fab', props?: Record<string,string>): void
  ```
  Mensagem exata:
  ```
  Olá, Amene! Vim pelo site.
  Nome: {nome}
  Projeto: {tipo}
  Cidade: {cidade}
  Metragem: {metragem} m²      ← linha omitida se vazio
  ```

- [ ] **Step 1: testes que falham:**
  ```ts
  expect(buildWhatsAppUrl(null, lead)).toBeNull()
  const url = buildWhatsAppUrl('5547999999999', { nome:'José & Maria #1 🏡', tipo:'Outro', cidade:'São José', metragem:120 })!
  expect(url.startsWith('https://wa.me/5547999999999?text=')).toBe(true)
  expect(decodeURIComponent(url.split('text=')[1])).toBe(buildLeadMessage(/*mesmo lead*/))
  expect(buildLeadMessage({...lead, metragem: undefined})).not.toContain('Metragem')
  expect(leadSchema.safeParse({nome:' ', tipo:'Outro', cidade:'X'}).success).toBe(false)   // nome só espaço
  ```
- [ ] **Step 2:** implementar (`encodeURIComponent` no texto inteiro; `trim` em todos os campos); PASS.
- [ ] **Step 3:** `LeadForm`: rótulos visíveis, valida no blur e limpa erro ao digitar, botão "Conversar no WhatsApp". Sem número: botão vira "Contato direto em breve" desabilitado + link do Instagram em destaque, sem `track`. Com número: `track('lead_whatsapp',{tipo})` e `window.location.href = url` (não `window.open`). Mensagens de erro: "Conte seu nome para a gente", "Escolha o tipo de projeto", "Em qual cidade é o projeto?", "Use só números, entre 10 e 5000".
- [ ] **Step 4: e2e** `lead.spec.ts`: blur em nome vazio mostra erro; digitar limpa; com `site.whatsapp.number` nulo o botão está desabilitado e o link do Instagram visível. PASS.
- [ ] **Step 5:** commit `feat: formulário de lead que abre o WhatsApp`.

---

### Task 6: Seções institucionais da home

**Files:**
- Create: `src/components/sections/{Manifesto,ProjetosDestaque,Processo,Estudio,Contato}.tsx`, `tests/e2e/home.spec.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getProjects`, `getPhoto` (Task 4), `LeadForm` (Task 5), `paletteAt` via CSS vars (Task 3).
- Ordem dos `section` com `id`: `casa`, `manifesto`, `projetos`, `processo`, `estudio`, `contato`. A seção `casa` é um placeholder estático até a Task 10.

- [ ] **Step 1: e2e que falha:** os 6 `id`s existem na ordem; cada seção tem um `h2`; todas as `img` têm `alt` não vazio; `#contato` contém o formulário; o link "Ver projeto completo" aponta para `/projetos/apartamento-pedra`.
- [ ] **Step 2:** Manifesto: uma frase provisória (marcada placeholder no `site.ts`, ex. "Casas que acordam devagar: pedra, madeira e luz natural desenhadas para a rotina de quem mora.") com palavras acendendo por ScrollTrigger (`opacity .2 → 1`; com reduced-motion já em 1). Processo: 4 etapas reais do spec com números (é sequência). Estúdio: usa `IMG_5034` como imagem; textos placeholder. Contato: fundo do "anoitecer" + `LeadForm` + Instagram.
- [ ] **Step 3:** `npm run build && npm run test:e2e` PASS.
- [ ] **Step 4:** commit `feat: seções institucionais da home`.

---

### Task 7: Página do projeto

**Files:**
- Create: `src/app/projetos/[slug]/page.tsx`, `src/components/project/ProjectGallery.tsx`, `tests/e2e/projeto.spec.ts`
- Modify: `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `getProjects`, `getProject`, `getPhoto` (Task 4); `projectMetadata`, `projectJsonLd` (Task 8 — nesta task usar `generateMetadata` simples; Task 8 substitui).
- `generateStaticParams` a partir de `getProjects()`; `dynamicParams = false`.

- [ ] **Step 1: e2e que falha:** `/projetos/apartamento-pedra` responde 200 com `h1` = nome do projeto e um `h2` por cômodo; `/projetos/xyz` responde 404 com link para a home.
- [ ] **Step 2:** layout editorial: capa grande, conceito, ficha técnica, cômodos com fotos em composições alternadas (retrato/paisagem conforme `width/height`), CTA para `/#contato`. Imagens com `next/image`, `placeholder="blur"`, `sizes` corretos; só a capa com `priority`. Transição home→projeto com View Transitions do Next (`experimental.viewTransition`) — se indisponível na 16.4, fade com GSAP.
- [ ] **Step 3:** PASS; commit `feat: página do projeto`.

---

### Task 8: SEO técnico

**Files:**
- Create: `src/lib/seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, `src/app/projetos/[slug]/opengraph-image.tsx`, `tests/unit/seo.test.ts`, `tests/e2e/seo.spec.ts`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/projetos/[slug]/page.tsx`

**Interfaces:**
- Produces:
  ```ts
  function orgJsonLd(s: SiteConfig): object        // @type ProfessionalService; omite address/telephone se placeholder/null
  function projectJsonLd(p: Projeto, s: SiteConfig): object   // @type CreativeWork, image: ImageObject[] absolutas
  function projectMetadata(p: Projeto, s: SiteConfig): Metadata
  ```
- `sitemap.ts`: home + uma URL por projeto + `/privacidade`. `robots.ts`: allow `/`, `sitemap` absoluto.

- [ ] **Step 1: testes que falham:** `orgJsonLd` com endereço placeholder não tem `address`; com `whatsapp.number` nulo não tem `telephone`; `projectJsonLd(...).image[0].url` começa com `site.url`; sitemap contém `${site.url}/projetos/apartamento-pedra`.
- [ ] **Step 2:** implementar; JSON-LD via `<script type="application/ld+json">` no layout (org) e na página do projeto. Metadados: `title.template '%s · Amene'`, `description`, `alternates.canonical`, `openGraph` (locale `pt_BR`), `twitter: summary_large_image`. OG images 1200×630 com foto de capa + "AMENE".
- [ ] **Step 3: e2e:** `/robots.txt` e `/sitemap.xml` 200; home tem `link[rel=canonical]` e `meta[property="og:image"]`; JSON-LD parseia como JSON válido. PASS.
- [ ] **Step 4:** commit `feat: SEO técnico (metadados, sitemap, robots, JSON-LD, OG)`.

---

### Task 9: Maquete procedural do apartamento (dados + geometria)

**Files:**
- Create: `src/three/apartment/layout.ts`, `src/three/apartment/materials.ts`, `src/three/apartment/ApartmentModel.tsx`, `src/three/apartment/rooms/{Cozinha,Living,Lavabo,SuiteCasal,QuartoSolteiro,SuiteRipada,QuartoEscrivaninha,QuartoEspelho}.tsx`, `tests/unit/layout.test.ts`

**Interfaces:**
- Consumes: `RoomId`, `getProject` (Task 4); texturas `public/textures/*` (Task 2).
- Produces:
  ```ts
  type Rect = { x0: number; z0: number; x1: number; z1: number }   // metros, plano XZ
  type Opening = { wall: 'n'|'s'|'e'|'w'; center: number; width: number; y0: number; y1: number; kind: 'porta'|'janela'|'vao' }
  type RoomLayout = { id: RoomId; rect: Rect; openings: Opening[]; labelAt: [number, number, number] }
  const APARTMENT: { height: 2.7; wallThickness: 0.12; rooms: RoomLayout[] }
  function exteriorWalls(a: typeof APARTMENT): Array<{ side: 'n'|'s'|'e'|'w'; normal: [number, number]; ... }>
  <ApartmentModel source={{ kind: 'procedural' } | { kind: 'glb'; url: string; lightmaps: { manha: string; noite: string } }} lighting="manha"|"noite" />
  ```
  Cada parede externa é um grupo nomeado `wall-${side}` (WallFader da Task 10 depende disso).
- Disposição estimada (até chegar a planta): cozinha+jantar integrada ao living num eixo único (pedra contínua liga os dois, como nas fotos IMG_4607/IMG_4736); lavabo próximo ao living; corredor íntimo com os 5 quartos.

- [ ] **Step 1: testes que falham:** retângulos dos cômodos não se sobrepõem (área de interseção < 0,01 m²); cada `RoomId` do projeto tem exatamente um `RoomLayout` e vice-versa; toda `Opening.width` cabe na parede onde está; `labelAt` está dentro do `rect`.
- [ ] **Step 2:** implementar `layout.ts`; PASS.
- [ ] **Step 3:** `materials.ts` com `MeshStandardMaterial` PBR: pedra (map + bumpMap das texturas, repetição ≈ 0,9 m por tile), freijó, freijó escuro (ripado), bouclê (bump de ruído), linho, mármore verde da mesa (IMG_4607), inox, porcelanato claro, cortina voile translúcida. `ApartmentModel` procedural monta piso, paredes com aberturas (sem forro), rodapés; cada cômodo adiciona o mobiliário-chave das fotos com `RoundedBox` (drei): cozinha (ilha branca, adega, cadeiras de couro, mesa oval de mármore verde, painel de pedra com churrasqueira); living (sofá bouclê curvo, manta terracota, mesas inox + mármore escuro, rack flutuante, ripado, TV, estante com cristaleira); lavabo (cuba-bacia, espelho orgânico, parede de seixos via bump); quartos conforme fotos (treliça, ripado, escrivaninha curva, espelho orgânico, camas de solteiro).
- [ ] **Step 4:** verificação visual: página `/dev/maquete` (só em `NODE_ENV=development`) renderiza a maquete com `OrbitControls` do drei; screenshot Playwright salvo em `tests/e2e/__screenshots__/maquete.png` para revisão humana. Commit `feat: maquete procedural do apartamento`.

---

### Task 10: Interação da maquete (câmera, paredes, rótulos, dia/noite)

**Files:**
- Create: `src/three/camera/cameraMath.ts`, `src/three/camera/{OrbitRig,WallFader,RoomLabels,Lighting}.tsx`, `src/components/house/{HouseSection,RoomNav,RoomPanel}.tsx`, `tests/unit/cameraMath.test.ts`, `tests/e2e/house.spec.ts`
- Modify: `src/components/sections` (seção `casa` deixa de ser placeholder), `src/app/page.tsx`

**Interfaces:**
- Consumes: `APARTMENT`, `ApartmentModel` (Task 9); `getProject`, `getPhoto` (Task 4).
- Produces:
  ```ts
  type Spherical = { target: [number,number,number]; r: number; theta: number; phi: number }
  const VIEWS: Record<'overview' | RoomId, Spherical>   // overview: r 27, phi .95; cômodos phi ≈ .68
  function shortestTheta(from: number, to: number): number
  function lerpSpherical(a: Spherical, b: Spherical, k: number): Spherical
  function easeInOutCubic(t: number): number
  function clampPhi(phi: number): number          // [0.15, 1.45]
  function clampRadius(r: number): number          // [4, 55]
  function wallOpacity(normal: [number,number], camDirXZ: [number,number]): number  // dot > .3 → .15, senão 1
  type HouseState = { view: 'overview' | RoomId; lighting: 'manha' | 'noite'; panelOpen: boolean }
  ```
- Regras: voo 1,6 s com `easeInOutCubic`; auto-rotação `.06 rad/s` após 7 s sem interação, só em `overview` e sem reduced-motion; roda sem Ctrl não é capturada (`passive`, não chama `preventDefault`); Ctrl+roda e botões +/− dão zoom; um dedo gira, pinça dá zoom, `touch-action: pan-y` no canvas para a página continuar rolando verticalmente com o dedo quando o gesto é vertical.

- [ ] **Step 1: testes que falham:**
  ```ts
  expect(shortestTheta(3, -3)).toBeCloseTo(-3 + 2*Math.PI)
  expect(lerpSpherical(a, b, 0)).toEqual(a); expect(lerpSpherical(a, b, 1)).toEqual({...b, theta: shortestTheta(a.theta, b.theta)})
  expect(clampPhi(2)).toBe(1.45); expect(clampRadius(1)).toBe(4)
  expect(wallOpacity([0,1],[0,1])).toBe(.15); expect(wallOpacity([0,1],[1,0])).toBe(1)
  ```
- [ ] **Step 2:** implementar `cameraMath.ts`; PASS.
- [ ] **Step 3:** componentes: `OrbitRig` (estado esférico próprio + tween), `WallFader` (anima opacidade dos grupos `wall-*`), `RoomLabels` (drei `Html`, visíveis só em overview, são `<button>` acessíveis), `Lighting` (manhã: sol direcional quente + hemisfério; noite: luzes pontuais quentes nos cômodos; sombras PCFSoft; `@react-three/postprocessing` com N8AO leve e tone mapping ACES), `RoomNav` (barra com Visão geral + cômodos + Dia/Noite + zoom +/−; teclado: setas trocam de cômodo), `RoomPanel` (ao entrar num cômodo: nome, descrição, 3–4 fotos com `next/image`, link "Ver projeto completo"; fecha com Esc e devolve foco).
- [ ] **Step 4: e2e:** clicar em "Living" na `RoomNav` abre o `RoomPanel` com `h3` "Living" e ≥ 3 imagens; Esc fecha e o foco volta ao botão; rolar a roda do mouse sobre o canvas muda `window.scrollY` (a página rola). PASS.
- [ ] **Step 5:** commit `feat: interação da maquete 3D`.

---

### Task 11: Níveis de qualidade e fallback sem 3D

**Files:**
- Create: `src/lib/quality.ts`, `src/components/house/HouseFallback.tsx`, `tests/unit/quality.test.ts`, `tests/e2e/fallback.spec.ts`
- Modify: `src/components/house/HouseSection.tsx`

**Interfaces:**
- Produces:
  ```ts
  type Tier = 'none' | 'low' | 'high'
  function detectTier(env: { webgl: boolean; deviceMemory?: number; hardwareConcurrency?: number; saveData?: boolean; params: URLSearchParams }): Tier
  ```
  `none` se `!webgl` ou `params.get('3d') === '0'`; `low` se `saveData` ou `deviceMemory <= 4` ou `hardwareConcurrency <= 4`; senão `high`. `low` = DPR ≤ 1,5, sombras 1024, sem pós-processamento.
- `HouseFallback`: imagem estática da maquete (`public/maquete-fallback.webp`, gerada por screenshot da Task 9) + grade de capas por cômodo, cada uma abre o mesmo `RoomPanel`.
- Perda de contexto WebGL (`webglcontextlost`) troca para `HouseFallback` sem erro não tratado.

- [ ] **Step 1: testes que falham** para as regras de `detectTier` acima (um caso por regra).
- [ ] **Step 2:** implementar; PASS.
- [ ] **Step 3: e2e** `fallback.spec.ts`: com `?3d=0` a seção `#casa` mostra a grade, clicar num cômodo abre o painel, e `page.on('pageerror')` não registra nada. Segundo caso com projeto Playwright `chromium` + `launchOptions.args: ['--disable-webgl','--disable-gpu']`. PASS.
- [ ] **Step 4:** commit `feat: níveis de qualidade e fallback da maquete`.

---

### Task 12: Abertura (amanhecer + letras + clarão)

**Files:**
- Create: `src/lib/introMachine.ts`, `src/components/intro/{Intro,IntroDawnScene,FallingLetters}.tsx`, `tests/unit/introMachine.test.ts`, `tests/e2e/intro.spec.ts`
- Modify: `src/app/page.tsx`, `src/components/layout/WhatsAppFab.tsx` (visível só após `done`)

**Interfaces:**
- Produces:
  ```ts
  type IntroPhase = 'black' | 'dawn' | 'letters' | 'logo' | 'flash' | 'done'
  type IntroMode = 'full' | 'short' | 'reduced'
  function introMode(o: { seenThisSession: boolean; reducedMotion: boolean }): IntroMode   // reduced > short > full
  function introTimeline(mode: IntroMode): Array<{ phase: IntroPhase; at: number }>   // segundos
  function introReducer(s: IntroPhase, e: { type: 'tick'; t: number; mode: IntroMode } | { type: 'skip' }): IntroPhase
  ```
  Timeline `full`: black 0 · dawn .6 · letters 6.5 (A, M, E, N, E a cada .35 s) · logo 9.0 · flash 10.2 · done 10.8. `short`: logo 0 · flash .9 · done 1.4. `reduced`: logo 0 (fade) · done 1.2. `skip` de qualquer fase → `done`.
- `sessionStorage['amene:intro-seen']` em try/catch (falha ⇒ tratar como não visto).
- `IntroDawnScene`: se `site.intro.videoSrc` existe, `<video muted playsInline autoplay>`; senão, cena em tempo real portada do protótipo `prototipos/abertura-ab.html` (variante A), reutilizando `ApartmentModel` com câmera no living e animação de sol/céu/exposição/poeira.
- `FallingLetters`: letras HTML (SEO-neutras, `aria-hidden`), queda com GSAP (`y: -120vh → 0`, leve rotação, `ease: 'bounce.out'` suavizado) e encaixe no logo; clarão = overlay branco `opacity 0 → 1 → 0`.
- Acessibilidade: a camada visual (`position: fixed`) tem `aria-hidden="true"`. O botão "Pular abertura" fica **fora** dela, como primeiro elemento focável do `<body>`. O `<main>` nunca recebe `inert`. Durante a abertura a rolagem fica parada (`lenis.stop()`), e Esc, Tab ou a roda do mouse disparam `skip`.

- [ ] **Step 1: testes que falham:**
  ```ts
  expect(introMode({ seenThisSession: true, reducedMotion: true })).toBe('reduced')
  expect(introMode({ seenThisSession: true, reducedMotion: false })).toBe('short')
  expect(introReducer('dawn', { type: 'skip' })).toBe('done')
  expect(introReducer('black', { type: 'tick', t: 7, mode: 'full' })).toBe('letters')
  expect(introReducer('black', { type: 'tick', t: 99, mode: 'full' })).toBe('done')
  ```
- [ ] **Step 2:** implementar; PASS.
- [ ] **Step 3:** componentes conforme Interfaces; o 3D da seção `casa` só monta depois de `phase === 'flash'` (dynamic import com `ssr:false`), exceto quando a abertura usa a própria maquete (aí reaproveita o Canvas carregado).
- [ ] **Step 4: e2e:** primeira visita mostra o botão "Pular abertura"; Esc → camada some em < 1 s e `h1` visível; recarregar na mesma sessão → modo `short` (camada some em < 2 s sem clicar); `page.emulateMedia({ reducedMotion: 'reduce' })` → sem elementos `.falling-letter` animando; rolar a roda durante a abertura → `done`. PASS.
- [ ] **Step 5:** commit `feat: abertura com amanhecer, letras e clarão`.

---

### Task 13: Analytics, desempenho e deploy

**Files:**
- Modify: `src/app/layout.tsx` (`<Analytics />`), `next.config.ts` (formatos `image/avif,image/webp`, headers de cache longos para `/textures` e `/projetos`), `src/lib/analytics.ts` (usa `track` de `@vercel/analytics`)
- Create: `tests/e2e/perf.spec.ts`

- [ ] **Step 1:** ligar `track` real; Instagram e FAB disparam `click_instagram`/`click_whatsapp_fab`.
- [ ] **Step 2: e2e** `perf.spec.ts`: na carga inicial da home, nenhuma requisição a `three`/chunks do Canvas antes do fim da abertura em modo `short` (verificar via `page.on('request')` que o chunk do Canvas só é pedido após o evento); total de bytes de imagens acima da dobra < 600 KB.
- [ ] **Step 3:** `npm run build && npm run start`, rodar Lighthouse mobile (Chrome DevTools MCP `lighthouse_audit` ou `npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile`) na home e na página do projeto. Esperado: Performance ≥ 90, SEO 100, Acessibilidade ≥ 95, LCP < 2,5 s. Corrigir o que faltar antes de seguir.
- [ ] **Step 4:** conectar o repositório na Vercel (ação do cliente: importar `Elebeg/amenestudio`), confirmar build verde e anotar a URL de produção em `site.url`.
- [ ] **Step 5:** commit `chore: analytics, ajustes de desempenho e deploy`.

---

## Fora deste plano (próximos planos)
- **Fase 2 — assets reais:** scripts Blender (bpy) para limpar o modelo do escritório, materiais, bake manhã/noite, render do vídeo da abertura, export glTF Draco/Meshopt + KTX2; troca `ApartmentModel source` para `glb` e `site.intro.videoSrc`.
- Layout de listagem para vários projetos e CMS.
- Ajustes da referência visual que o cliente ainda pode enviar.
