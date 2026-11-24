# Estilo ilustrado (A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar à abertura e à maquete interativa um visual de "ilustração arquitetônica suave" (faixas de luz, sombras coloridas, contorno fino e quente), mantendo o realismo reconhecível e sem piorar o desempenho.

**Architecture:** Um módulo `src/three/style/` concentra a lógica: funções puras de rampa/quantização (testáveis), um patch de shader via `onBeforeCompile` aplicado aos `MeshStandardMaterial` por instância, e um passe de contorno de pós-processamento (profundidade + normais). Uma chave `site.visual.estilo` escolhe `ilustrado` (padrão) ou `realista`, para reverter sem retrabalho. As duas cenas (abertura e maquete) consomem o mesmo módulo.

**Tech Stack:** three 0.187 · @react-three/fiber 9.8 · @react-three/postprocessing 3.2 (postprocessing `Effect` customizado) · sharp 0.35 · vitest 5.1 · Playwright 1.65

**Spec:** `docs/superpowers/specs/2026-11-23-estilo-ilustrado-design.md`

## Global Constraints
- Estilo "levemente cartunesco": nada de cel-shading duro, contorno preto grosso ou cores saturadas.
- Faixas de luz: 3–4 tons com transição suave (largura de transição ≥ 0,08 em NdotL).
- Sombra fria lilás/azul (alvo `#6d6a8a` a ~35% de mistura no tom mais escuro); luz quente dourada (alvo `#f3d9b0` a ~20% no tom mais claro); amanhecer intensifica o calor.
- Contorno: ~1 px em DPR 1, cor `#6b4e3a`, opacidade ~0,6; desligado no nível `low`.
- Sai o N8AO das duas cenas no estilo `ilustrado`; desempenho igual ou melhor (medir draw calls e Lighthouse antes/depois).
- Materiais continuam por instância (`createInstanceMaterials`); nada mutável compartilhado entre Canvas.
- Texturas originais preservadas (Fase 2); as versões "ilustradas" são geradas à parte.
- `prefers-reduced-motion`, níveis de qualidade e fallback continuam funcionando.
- Commits em português com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus
1. **Noite na maquete** — faixas/rampa não podem deixar a cena noturna ilegível ou lavada; as luzes pontuais quentes continuam lidas como luz.
2. **Vidro, voile e materiais transparentes** — o patch não pode quebrar transparência (WallFader multiplica `baseOpacity`) nem gerar contorno em superfícies quase invisíveis.
3. **Nível `low` / celular** — sem contorno, sem pós-processamento; faixas ainda aplicadas e antialias do canvas ligado.
4. **Alternar `estilo: 'realista'`** — volta exatamente ao visual anterior (N8AO incluso).
5. **Contorno nas bordas da tela e no fundo** — sem halo ao redor do céu/fundo nem serrilhado forte no movimento da câmera.

---

### Task S1: Núcleo do estilo — rampa pura, patch de material e texturas ilustradas

**Files:**
- Create: `src/three/style/ramp.ts`, `src/three/style/patchMaterial.ts`, `src/three/style/index.ts`, `tests/unit/style-ramp.test.ts`, `scripts/illustrate-textures.mjs`
- Modify: `src/config/site.ts` (`visual: { estilo: 'ilustrado' | 'realista' }`, padrão `'ilustrado'`), `src/three/apartment/materials.ts` (aplicar patch quando estilo = ilustrado; usar texturas `*-ilustrado.webp`), `package.json` (`"textures:ilustrado"`)

**Interfaces:**
- Produces:
  ```ts
  type StyleParams = { bands: 3 | 4; softness: number; shadowTint: string; shadowMix: number; lightTint: string; lightMix: number }
  const STYLE_DAY: StyleParams; const STYLE_NIGHT: StyleParams; const STYLE_DAWN: StyleParams
  function bandValue(ndotl: number, bands: number, softness: number): number   // [0,1] → [0,1], monotônica
  function tintAt(level: number, p: StyleParams): [number, number, number]       // RGB linear multiplicador
  function patchMaterial(m: THREE.MeshStandardMaterial, p: StyleParams): void    // idempotente; mantém transparent/opacity
  function setStyleParams(m: THREE.Material, p: StyleParams): void              // atualiza uniforms sem recompilar
  ```
- O GLSL reproduz `bandValue`/`tintAt` exatamente (mesmas constantes, documentadas lado a lado).

- [ ] **Step 1: testes que falham** (`style-ramp.test.ts`): `bandValue` é monotônica não-decrescente em 0..1 (passo 0,001); com `bands=4` tem exatamente 4 platôs (variação < 0,01 dentro de cada platô longe das transições); `bandValue(0)=0`, `bandValue(1)=1`; `tintAt(0, STYLE_DAY)` puxa para `shadowTint` (canal azul relativo > vermelho) e `tintAt(1, STYLE_DAY)` puxa para `lightTint` (vermelho ≥ azul); `patchMaterial` duas vezes no mesmo material não duplica o código do shader (contar ocorrências de um marcador).
- [ ] **Step 2:** implementar; PASS.
- [ ] **Step 3:** `illustrate-textures.mjs`: de `public/textures/{stone,wood,wood-dark}.webp` gera `*-ilustrado.webp` (sharp: `median(3)`, leve redução de saturação 10%, posterização suave via tabela de 12 níveis por canal). Bump da pedra: versão suavizada `stone-bump-ilustrado.webp`.
- [ ] **Step 4:** `materials.ts` usa o patch + texturas ilustradas quando `site.visual.estilo==='ilustrado'`; `realista` mantém o comportamento atual byte a byte. `npm test`, `npm run lint`, `npm run build` (PowerShell). Commit.

### Task S2: Contorno e luz da maquete no estilo ilustrado

**Files:**
- Create: `src/three/style/OutlineEffect.tsx` (postprocessing `Effect` com profundidade + normais), `tests/unit/style-outline.test.ts` (parâmetros/config puros)
- Modify: `src/three/camera/Lighting.tsx` (ilustrado: sem N8AO; `OutlineEffect` no high; `setStyleParams` dia↔noite acompanhando o fade existente), `src/three/camera/HouseScene.tsx` (normal pass / `NormalPass` se necessário)

**Interfaces:**
- Consumes: `patchMaterial`, `setStyleParams`, `STYLE_DAY`, `STYLE_NIGHT` (S1).
- Produces: `<IllustratedOutline color="#6b4e3a" opacity={0.6} thickness={1} />`; `outlineConfig(dpr: number): { thickness: number; depthThreshold: number; normalThreshold: number }` (pura, testada: espessura escala com DPR e nunca < 1).

- [ ] **Step 1: testes que falham** para `outlineConfig` (DPR 1→1, 2→2, 1.5→1.5; thresholds constantes documentados).
- [ ] **Step 2:** implementar efeito + integração. Contorno ignora fundo (depth = far) e materiais com opacidade efetiva < 0,3 (vidro/voile): renderizar esses objetos numa layer excluída do normal pass.
- [ ] **Step 3:** screenshots (Chromium com GPU real: `--use-angle=d3d11`, ou SwiftShader se indisponível — registrar qual) da maquete: visão geral dia, living com painel, noite, lavabo; 1440px e 390px → `.superpowers/sdd/2026-11-23-estilo-ilustrado/shots/s2-*.png`. Olhar e iterar ≤3 vezes contra o Review Focus 1, 2, 5.
- [ ] **Step 4:** medir draw calls (dia/noite) e comparar com 454/460 do realista. `npm test`, lint, `$env:E2E_PORT='3130'; npm run build; npm run test:e2e`. Commit.

### Task S3: Abertura no estilo ilustrado + medição final

**Files:**
- Modify: `src/three/intro/DawnCanvas.tsx` (patch com `STYLE_DAWN`, `setStyleParams` acompanhando a rampa do amanhecer: calor máximo no início, convergindo a `STYLE_DAY`), `src/components/intro/StillFrame.tsx` ou equivalente (o quadro estático do celular ganha o mesmo tom ilustrado via CSS: gradiente + `filter` leve, sem nova imagem pesada)
- Create: `tests/unit/style-dawn.test.ts`

**Interfaces:**
- Consumes: S1 + `outlineConfig`/`IllustratedOutline` (S2).
- Produces: `dawnStyleAt(ramp: number): StyleParams` (pura: `ramp=0` → `STYLE_DAWN`, `ramp=1` → `STYLE_DAY`, interpolação monotônica de `shadowMix`/`lightMix`).

- [ ] **Step 1: testes que falham** para `dawnStyleAt` nos extremos e monotonia.
- [ ] **Step 2:** implementar; PASS.
- [ ] **Step 3:** sequência de screenshots da abertura (0,5/3/6/7,5/9,5 s, 1440×900, com `NEXT_PUBLIC_INTRO_DEBUG=1`) → `.superpowers/sdd/2026-11-23-estilo-ilustrado/shots/s3-*.png`; olhar e iterar ≤3 vezes: pedra reconhecível, letras legíveis, "não muito cartunesco".
- [ ] **Step 4:** Lighthouse mobile da home (primeira visita) e da página do projeto antes/depois; registrar. `npm test`, lint, e2e completo. Commit.
