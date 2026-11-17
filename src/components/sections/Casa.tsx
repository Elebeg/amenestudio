import Image from 'next/image'
import Link from 'next/link'
import { getPhoto, getProjects } from '@/content/projetos'
import s from './home.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * 01 · A casa. Placeholder estático até a Task 10: o conteúdo de `[data-casa-stage]`
 * (a capa do projeto) é o que o canvas 3D substitui; título, cômodos e link ficam.
 */
export function Casa() {
  const projeto = getProjects()[0]
  const capa = getPhoto(projeto.capa)
  return (
    <section id="casa" className={s.casa} aria-labelledby="casa-titulo">
      <div className={s.casaIntro}>
        <p className={s.eyebrow}>Arquitetura e interiores</p>
        <h1 className={s.casaH1}>
          <span className="sr-only">Amene, arquitetura e interiores: </span>
          Casas desenhadas pela luz de cada hora
        </h1>
      </div>

      <div className={s.casaStage} data-casa-stage>
        <Image
          src={capa.src}
          width={capa.width}
          height={capa.height}
          placeholder="blur"
          blurDataURL={capa.blurDataURL}
          alt={`${projeto.nome}: living com parede de pedra natural, painéis de freijó e sofá em bouclê`}
          sizes="(min-width: 900px) 60vw, 100vw"
          preload
        />
      </div>

      <div className={s.casaInfo}>
        <p className={s.eyebrow}>
          <span className={s.num}>01</span> A casa
        </p>
        <h2 id="casa-titulo" className={s.casaH2}>
          {projeto.nome}
        </h2>
        <ol className={s.rooms} aria-label="Ambientes do projeto">
          {projeto.rooms.map((r, i) => (
            <li key={r.id}>
              <span className={s.num} aria-hidden="true">
                {pad(i + 1)}
              </span>
              {r.nome}
            </li>
          ))}
        </ol>
        <Link href={`/projetos/${projeto.slug}`} className={s.textLink}>
          Ver projeto completo
        </Link>
      </div>
    </section>
  )
}
