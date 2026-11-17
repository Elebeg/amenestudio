import Image from 'next/image'
import { site } from '@/config/site'
import { getPhoto } from '@/content/projetos'
import s from './home.module.css'

export function Estudio() {
  const foto = getPhoto('IMG_5034')
  const { titulo, texto, cidade } = site.estudio
  return (
    <section id="estudio" className={s.estudio} aria-labelledby="estudio-titulo">
      <figure className={s.estudioFoto}>
        <Image
          src={foto.src}
          width={foto.width}
          height={foto.height}
          placeholder="blur"
          blurDataURL={foto.blurDataURL}
          alt="Duas pessoas em movimento no living do Apartamento Pedra, entre estantes de freijó e a parede de pedra"
          sizes="(min-width: 900px) 62vw, 100vw"
        />
      </figure>
      <div className={s.estudioTexto}>
        <p className={s.eyebrow}>
          <span className={s.num}>05</span> Estúdio
        </p>
        <h2 id="estudio-titulo" className={s.h2}>
          {titulo}
        </h2>
        {texto.map((t) => (
          <p key={t} className={s.corpo}>
            {t}
          </p>
        ))}
        <dl className={s.ficha}>
          <div>
            <dt>Atuação</dt>
            <dd>{cidade}</dd>
          </div>
          <div>
            <dt>Escopo</dt>
            <dd>Arquitetura e interiores</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
