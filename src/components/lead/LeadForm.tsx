'use client'

import { useState } from 'react'
import { site } from '@/config/site'
import { track } from '@/lib/analytics'
import { TIPOS, buildWhatsAppUrl, leadSchema } from '@/lib/whatsapp'
import s from './LeadForm.module.css'

type Campo = 'nome' | 'tipo' | 'cidade' | 'metragem'
type Valores = Record<Campo, string>
type Erros = Partial<Record<Campo, string>>

const CAMPOS: Campo[] = ['nome', 'tipo', 'cidade', 'metragem']

function validar(valores: Valores) {
  const r = leadSchema.safeParse(valores)
  const erros: Erros = {}
  if (!r.success) {
    for (const issue of r.error.issues) {
      const k = issue.path[0] as Campo
      if (CAMPOS.includes(k) && !erros[k]) erros[k] = issue.message
    }
  }
  return { data: r.success ? r.data : null, erros }
}

export function LeadForm() {
  const [valores, setValores] = useState<Valores>({ nome: '', tipo: '', cidade: '', metragem: '' })
  const [erros, setErros] = useState<Erros>({})
  const numero = site.whatsapp.number

  const onChange = (campo: Campo, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }
  const onBlur = (campo: Campo) => {
    const { erros: todos } = validar(valores)
    setErros((e) => ({ ...e, [campo]: todos[campo] }))
  }

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const { data, erros: todos } = validar(valores)
    if (!data) {
      setErros(todos)
      const primeiro = CAMPOS.find((c) => todos[c])
      if (primeiro) document.getElementById(`lead-${primeiro}`)?.focus()
      return
    }
    if (!numero) return
    const url = buildWhatsAppUrl(numero, data)
    if (!url) return
    track('lead_whatsapp', { tipo: data.tipo })
    window.location.href = url
  }

  const campoProps = (campo: Campo) => ({
    id: `lead-${campo}`,
    name: campo,
    value: valores[campo],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(campo, ev.target.value),
    onBlur: () => onBlur(campo),
    'aria-invalid': erros[campo] ? true : undefined,
    'aria-describedby': erros[campo] ? `lead-${campo}-erro` : undefined,
  })
  const erro = (campo: Campo) =>
    erros[campo] ? (
      <p id={`lead-${campo}-erro`} role="alert" className={s.erro}>
        {erros[campo]}
      </p>
    ) : null

  const instagram = (
    <a
      href={site.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className={s.instagram}
      onClick={() => track('click_instagram')}
    >
      <span>Instagram</span>
      <span className={s.handle}>@{site.instagram.handle}</span>
    </a>
  )

  return (
    <form onSubmit={onSubmit} noValidate className={s.form}>
      <div className={s.campo}>
        <label htmlFor="lead-nome">Nome</label>
        <input type="text" autoComplete="name" {...campoProps('nome')} />
        {erro('nome')}
      </div>
      <div className={s.campo}>
        <label htmlFor="lead-tipo">Tipo de projeto</label>
        <select {...campoProps('tipo')}>
          <option value="">Selecione</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {erro('tipo')}
      </div>
      <div className={s.campo}>
        <label htmlFor="lead-cidade">Cidade</label>
        <input type="text" autoComplete="address-level2" {...campoProps('cidade')} />
        {erro('cidade')}
      </div>
      <div className={s.campo}>
        <label htmlFor="lead-metragem">Metragem em m² (opcional)</label>
        <input type="text" inputMode="decimal" placeholder="Ex.: 120" {...campoProps('metragem')} />
        {erro('metragem')}
      </div>
      <div className={s.acoes}>
        {numero ? (
          <>
            <button type="submit" className={s.enviar}>
              Conversar no WhatsApp
            </button>
            {instagram}
          </>
        ) : (
          <>
            <button type="submit" disabled className={s.enviar}>
              Contato direto em breve
            </button>
            <p className={s.aviso}>Enquanto isso, fale com a gente pelo Instagram.</p>
            {instagram}
          </>
        )}
      </div>
    </form>
  )
}
