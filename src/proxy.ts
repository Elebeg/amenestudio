import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getProjects } from '@/content/projetos'
import { NOT_FOUND_REWRITE_PATH } from '@/lib/not-found-route'

/**
 * Tradeoff: com cacheComponents o shell é enviado antes do notFound() da página, então o status
 * seria 200 (apenas com noindex; ver docs do Next, loading.md > "Status codes"). A especificação
 * exige 404 real, então a checagem acontece aqui, antes de qualquer streaming. Custo: uma
 * invocação de função por navegação (documento) em /projetos/<slug> na Vercel.
 * O matcher abaixo dispensa requisições RSC e de prefetch, que nunca precisam do status.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/')[2]
  if (getProjects().some((p) => p.slug === slug)) return NextResponse.next()
  return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE_PATH, request.url))
}

export const config = {
  matcher: [
    {
      source: '/projetos/:slug',
      missing: [
        { type: 'header', key: 'rsc' },
        { type: 'header', key: 'next-router-prefetch' },
      ],
    },
  ],
}
