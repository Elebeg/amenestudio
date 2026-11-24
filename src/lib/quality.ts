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

/** Lê o ambiente do navegador (só no cliente). */
export function detectTierInBrowser(): Tier {
  const params = new URLSearchParams(window.location.search)
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return detectTier({
    webgl: probeWebgl(params),
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
    params,
  })
}
