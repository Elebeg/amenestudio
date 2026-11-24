'use client'

import { Component, type ReactNode } from 'react'

type Props = { onError: () => void; children: ReactNode }

/**
 * Isola a maquete: falha no chunk dinâmico, no contexto WebGL ou exceção do R3F não derruba
 * a home. O fallback é nada, porque a capa estática já está por baixo do canvas.
 */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Maquete 3D indisponível; mantendo a capa estática.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
