import { site } from '@/config/site'
import { ManifestoTexto } from './ManifestoTexto'
import s from './home.module.css'

export function Manifesto() {
  return (
    <section id="manifesto" className={s.manifesto} aria-labelledby="manifesto-titulo">
      <h2 id="manifesto-titulo" className={s.eyebrow}>
        <span className={s.num}>02</span> Manifesto
      </h2>
      <ManifestoTexto texto={site.manifesto.texto} className={s.manifestoTexto} />
    </section>
  )
}
