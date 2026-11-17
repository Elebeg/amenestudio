import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'
import { site } from '@/config/site'
import { jsonLdString, projectJsonLd, projectMetadata } from '@/lib/seo'
import { getPhoto, getProject, getProjects } from '@/content/projetos'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { PageEnter } from '@/components/project/PageEnter'
import styles from './page.module.css'

// `dynamicParams = false` é incompatível com cacheComponents; slugs desconhecidos caem em notFound().
export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/projetos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const projeto = getProject(slug)
  if (!projeto) return {}
  return projectMetadata(projeto, site)
}

export default async function ProjetoPage({ params }: PageProps<'/projetos/[slug]'>) {
  const { slug } = await params
  const projeto = getProject(slug)
  if (!projeto) notFound()

  const cover = getPhoto(projeto.capa)
  const photosByRoom = projeto.rooms.map((r) => r.fotos.map(getPhoto))

  const all = getProjects()
  const next = all.length > 1 ? all[(all.findIndex((p) => p.slug === projeto.slug) + 1) % all.length] : null

  const meta = [
    projeto.local && projeto.local !== 'A definir' ? { rotulo: 'Local', valor: projeto.local } : null,
    projeto.metragem ? { rotulo: 'Área', valor: `${projeto.metragem} m²` } : null,
    projeto.ano ? { rotulo: 'Ano', valor: String(projeto.ano) } : null,
  ].filter((m): m is { rotulo: string; valor: string } => m !== null)

  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(projectJsonLd(projeto, site)) }}
      />
      <PageEnter>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Projeto</p>
          <h1 className={styles.title}>{projeto.nome}</h1>
          {meta.length > 0 && (
            <dl className={styles.meta}>
              {meta.map((m) => (
                <div key={m.rotulo}>
                  <dt>{m.rotulo}</dt>
                  <dd>{m.valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <figure className={styles.cover} style={{ aspectRatio: `${cover.width} / ${cover.height}` }}>
          <ViewTransition name={`projeto-${projeto.slug}`} share="morph" default="none">
            <Image
              src={cover.src}
              width={cover.width}
              height={cover.height}
              alt={`${projeto.nome}: vista principal do living`}
              sizes="100vw"
              placeholder="blur"
              blurDataURL={cover.blurDataURL}
              priority
              className={styles.coverImg}
            />
          </ViewTransition>
        </figure>

        <section className={styles.concept} aria-label="Conceito e ficha técnica">
          <p className={styles.label}>Conceito</p>
          <p className={styles.conceptText}>{projeto.conceito}</p>
          {projeto.ficha.length > 0 && (
            <dl className={styles.ficha}>
              {projeto.ficha.map((f) => (
                <div key={f.rotulo}>
                  <dt>{f.rotulo}</dt>
                  <dd>{f.valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <ProjectGallery projectName={projeto.nome} rooms={projeto.rooms} photosByRoom={photosByRoom} />

        <section className={styles.cta}>
          <p className={styles.label}>Próximo passo</p>
          <p className={styles.ctaText}>Vamos pensar a luz e os materiais da sua casa.</p>
          <Link href="/#contato" className={styles.ctaLink}>
            Conversar sobre o seu projeto
          </Link>
        </section>

        {next && (
          <nav className={styles.next} aria-label="Próximo projeto">
            <Link href={`/projetos/${next.slug}`}>
              <span className={styles.label}>Próximo projeto</span>
              <span className={styles.nextName}>{next.nome}</span>
            </Link>
          </nav>
        )}
      </PageEnter>
    </main>
  )
}
