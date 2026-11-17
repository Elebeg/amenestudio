import { site } from '@/config/site'
import { ProcessoLinha } from './ProcessoLinha'
import s from './home.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

export function Processo() {
  const { intro, etapas } = site.processo
  return (
    <section id="processo" className={s.processo} aria-labelledby="processo-titulo">
      <header className={s.sectionHead}>
        <p className={s.eyebrow}>
          <span className={s.num}>04</span> Processo
        </p>
        <h2 id="processo-titulo" className={s.h2}>
          Do briefing à obra
        </h2>
        <p className={s.lede}>{intro}</p>
      </header>

      <div className={s.etapasWrap}>
        <ProcessoLinha className={s.linha} />
        <ol className={s.etapas}>
          {etapas.map((e, i) => (
            <li key={e.titulo} className={s.etapa}>
              <span className={s.etapaNum} aria-hidden="true">
                {pad(i + 1)}
              </span>
              <h3 className={s.h3}>{e.titulo}</h3>
              <p>{e.descricao}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
