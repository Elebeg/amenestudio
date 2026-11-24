export type Tier = 'none' | 'low' | 'high'

export type TierEnv = {
  webgl: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
  saveData?: boolean
  params: URLSearchParams
}

/**
 * Nível de qualidade da maquete.
 * none: sem WebGL (ou `?3d=0`) → imagem estática e grade de cômodos.
 * low: economia de dados ou aparelho modesto → DPR ≤ 1,5, sombras 1024, sem pós-processamento.
 * high: o resto.
 */
export function detectTier(env: TierEnv): Tier {
  if (!env.webgl || env.params.get('3d') === '0') return 'none'
  if (
    env.saveData ||
    (env.deviceMemory !== undefined && env.deviceMemory <= 4) ||
    (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4)
  ) {
    return 'low'
  }
  return 'high'
}

/**
 * WebGL utilizável de verdade. Renderizador por software (SwiftShader, llvmpipe…) conta como
 * "sem WebGL"; `?maquete=1` pula só essa checagem (testes e2e com SwiftShader), nunca a de WebGL.
 */
export function probeWebgl(params: URLSearchParams): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const lose = () => gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (params.get('maquete') === '1') {
      lose()
      return true
    }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    lose()
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

let cached: Tier | undefined

/**
 * Lê o ambiente do navegador (só no cliente) e guarda o resultado: a sonda cria um contexto
 * WebGL e os parâmetros da URL não mudam durante a visita.
 */
export function detectTierInBrowser(): Tier {
  if (cached) return cached
  const params = new URLSearchParams(window.location.search)
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return (cached = detectTier({
    webgl: probeWebgl(params),
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
    params,
  }))
}

/**
 * Ponteiro grosso (celular/tablet) também usa `low`, mesmo com 8 GB e 8 núcleos. Isto é mais
 * rígido que a regra do briefing (`detectTier`), de propósito: aparelhos de toque esquentam e
 * gastam bateria com sombras 4096 e AO, e a Task 10 já os tratava como `low`.
 * A combinação fica em HouseSection (`coarse || tier === 'low'`).
 */
