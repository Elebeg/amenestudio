'use client'

import { useState } from 'react'
import { site } from '@/config/site'
import { track } from '@/lib/analytics'
import { TIPOS, buildWhatsAppUrl, leadSchema } from '@/lib/whatsapp'

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
    if (!numero) return
    const { data, erros: todos } = validar(valores)
    if (!data) {
      setErros(todos)
      return
    }
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
      <p id={`lead-${campo}-erro`} role="alert">
        {erros[campo]}
      </p>
    ) : null

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="lead-nome">Nome</label>
        <input type="text" autoComplete="name" {...campoProps('nome')} />
        {erro('nome')}
      </div>
      <div>
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
      <div>
        <label htmlFor="lead-cidade">Cidade</label>
        <input type="text" autoComplete="address-level2" {...campoProps('cidade')} />
        {erro('cidade')}
      </div>
      <div>
        <label htmlFor="lead-metragem">Metragem em m² (opcional)</label>
        <input type="text" inputMode="decimal" placeholder="Ex.: 120" {...campoProps('metragem')} />
        {erro('metragem')}
      </div>
      {numero ? (
        <button type="submit">Conversar no WhatsApp</button>
      ) : (
        <>
          <button type="submit" disabled>
            Contato direto em breve
          </button>
          <p>
            Enquanto isso, fale com a gente pelo{' '}
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
              Instagram @{site.instagram.handle}
            </a>
            .
          </p>
        </>
      )}
    </form>
  )
}
