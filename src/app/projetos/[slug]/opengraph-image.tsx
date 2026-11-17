import { notFound } from 'next/navigation'
import { getPhoto, getProject, getProjects } from '@/content/projetos'
import { renderOg, OG_SIZE } from '@/lib/og'

export const alt = 'Projeto Amene'
export const size = OG_SIZE
export const contentType = 'image/png'

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const projeto = getProject(slug)
  if (!projeto) notFound()
  return renderOg(getPhoto(projeto.capa).src, projeto.nome)
}
