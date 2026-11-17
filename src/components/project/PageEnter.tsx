import { ViewTransition, type ReactNode } from 'react'

/**
 * Entrada da página do projeto.
 * Com View Transitions (React 19.3 + Next 16.4, sem flag) o navegador faz o crossfade.
 * Sem suporte, a classe `page-enter` (globals.css) aplica um fade só com CSS, sem JS e sem
 * esconder conteúdo (a animação termina visível). Respeita prefers-reduced-motion.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="page-fade">
      <div className="page-enter">{children}</div>
    </ViewTransition>
  )
}
