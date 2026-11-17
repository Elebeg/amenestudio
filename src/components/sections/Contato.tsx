import { LeadForm } from '@/components/lead/LeadForm'
import s from './home.module.css'

/** 06 · Contato. Ocupa a última tela do <main>, onde a paleta do dia chega ao anoitecer. */
export function Contato() {
  return (
    <section id="contato" className={s.contato} aria-labelledby="contato-titulo">
      <div className={s.contatoHead}>
        <p className={s.eyebrow}>
          <span className={s.num}>06</span> Contato
        </p>
        <h2 id="contato-titulo" className={s.contatoH2}>
          Vamos conversar sobre a sua casa
        </h2>
        <p className={s.lede}>
          Conte um pouco do projeto. A conversa continua no WhatsApp, com a mensagem já escrita.
        </p>
      </div>
      <div className={s.contatoForm}>
        <LeadForm />
      </div>
    </section>
  )
}
