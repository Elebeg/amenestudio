import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getProjects } from '@/content/projetos'

/**
 * Com cacheComponents o shell é enviado antes do notFound() da página (status 200).
 * Para devolver 404 de verdade em slugs inexistentes, a checagem acontece aqui,
 * antes de qualquer streaming (ver docs: loading.md > Status codes).
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/')[2]
  if (getProjects().some((p) => p.slug === slug)) return NextResponse.next()
  // Rota inexistente: o Next serve o not-found.tsx com status 404.
  return NextResponse.rewrite(new URL('/projeto-nao-encontrado', request.url))
}

export const config = {
  matcher: '/projetos/:slug',
}
