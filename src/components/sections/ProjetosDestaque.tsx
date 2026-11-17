import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import { getPhoto, getProjects } from '@/content/projetos'
import s from './home.module.css'

// Fotos do destaque na home (a capa já abre a página em #casa).
const DESTAQUE: Record<string, { principal: string; detalhe: string; altPrincipal: string; altDetalhe: string }> = {
  'apartamento-pedra': {
    principal: 'IMG_4592',
    detalhe: 'IMG_4759',
    altPrincipal: 'Mesa de jantar em mármore com cadeiras de madeira e couro caramelo, pedra natural ao fundo',
    altDetalhe: 'Parede de pedra natural sobre painel ripado e rack suspenso em freijó',
  },
}

const pad = (n: number) => String(n).padStart(2, '0')

export function ProjetosDestaque() {
  const projetos = getProjects()
  return (
    <section id="projetos" className={s.projetos} aria-labelledby="projetos-titulo">
      <header className={s.sectionHead}>
        <p className={s.eyebrow}>
          <span className={s.num}>03</span> Projetos
        </p>
        <h2 id="projetos-titulo" className={s.h2}>
          Projeto em destaque
        </h2>
      </header>

      <ul className={s.projetoLista}>
        {projetos.map((p, i) => {
          const d = DESTAQUE[p.slug]
          const principal = getPhoto(d?.principal ?? p.capa)
          const detalhe = d ? getPhoto(d.detalhe) : null
          return (
            <li key={p.slug} className={s.projeto}>
              <figure className={s.projetoPrincipal}>
                <ViewTransition name={`projeto-${p.slug}`} share="morph" default="none">
                  <Image
                    src={principal.src}
                    width={principal.width}
                    height={principal.height}
                    placeholder="blur"
                    blurDataURL={principal.blurDataURL}
                    alt={d?.altPrincipal ?? p.nome}
                    sizes="(min-width: 900px) 58vw, 100vw"
                  />
                </ViewTransition>
              </figure>
              {detalhe && (
                <figure className={s.projetoDetalhe}>
                  <Image
                    src={detalhe.src}
                    width={detalhe.width}
                    height={detalhe.height}
                    placeholder="blur"
                    blurDataURL={detalhe.blurDataURL}
                    alt={d!.altDetalhe}
                    sizes="(min-width: 900px) 30vw, 70vw"
                  />
                </figure>
              )}
              <div className={s.projetoTexto}>
                <span className={s.projetoIndice} aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <h3 className={s.h3}>{p.nome}</h3>
                <p className={s.lede}>{p.conceito}</p>
                <dl className={s.ficha}>
                  {p.ficha.map((f) => (
                    <div key={f.rotulo}>
                      <dt>{f.rotulo}</dt>
                      <dd>{f.valor}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Ambientes</dt>
                    <dd>{p.rooms.length}</dd>
                  </div>
                </dl>
                <Link href={`/projetos/${p.slug}`} className={s.textLink}>
                  Ver projeto completo
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
