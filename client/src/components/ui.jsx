import { cloneElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'

export function useForm(initial) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }
  return { form, setForm, error, setError, handleChange }
}

export function LoadingSection({ children }) {
  return <section className="loading-surface" aria-live="polite">{children}</section>
}

export function ErrorMessage({ error, className = '' }) {
  return error ? <p className={`error-message ${className}`} role="alert">{error}</p> : null
}

export function DataItem({ label, value }) {
  return <div className="data-item"><dt className="data-label">{label}</dt><dd className="data-value">{value || '—'}</dd></div>
}

export function FieldInput({ field, form, onChange }) {
  const { key, label, wide, as, type = 'text', min, step, autoComplete } = field
  const className = `form-input ${as === 'textarea' ? 'form-input-textarea' : ''}`
  return (
    <label className={`form-label ${wide ? 'form-grid-wide' : ''}`}>{label}
      {as === 'textarea'
        ? <textarea name={key} value={form[key]} onChange={onChange} required className={className} rows="4" />
        : <input name={key} type={type} value={form[key]} onChange={onChange} required className={className} min={min} step={step} autoComplete={autoComplete} />}
    </label>
  )
}

export function BackLink({ to, children }) {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(to)} className="back-link focus-ring"><span aria-hidden="true">←</span> {children}</button>
}

export function FormIntro({ mark, kicker, title, copy }) {
  return <div className="form-intro"><div className="form-intro-mark" aria-hidden="true">{mark}</div><div><p className="form-intro-kicker">{kicker}</p><h2 className="form-intro-title">{title}</h2><p className="form-intro-copy">{copy}</p></div></div>
}

export function ListPage({ endpoint, singular, plural, title, kicker, emptyText, deleteConfirm, renderCard }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(endpoint)
      .then(({ data }) => { if (active) setItems(data) })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, `No pudimos cargar los ${plural}. Intenta nuevamente.`)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [endpoint, plural])

  async function handleDelete(item) {
    if (!window.confirm(deleteConfirm(item))) return
    setDeletingId(item.id)
    setError('')
    try {
      await api.delete(`${endpoint}/${item.id}`)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, `No pudimos eliminar el ${singular}. Intenta nuevamente.`))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <LoadingSection>Cargando {plural}…</LoadingSection>
  return (
    <section>
      <div className="page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-kicker">{kicker}</p>
          <h2 className="page-title">{title}</h2>
          <p className="page-count">{items.length} {items.length === 1 ? `${singular} registrado` : `${plural} registrados`}</p>
        </div>
        <button type="button" onClick={() => navigate(`${endpoint}/nuevo`)} className="action-button focus-ring">Añadir {singular}</button>
      </div>
      <ErrorMessage error={error} className="mb-6" />
      {items.length === 0 && !error && <div className="empty-state"><h3>Aún no hay {plural}</h3><p>{emptyText}</p></div>}
      {items.length > 0 && <div className="entity-grid">{items.map((item) => cloneElement(renderCard(item, { onDelete: deleteConfirm ? handleDelete : undefined, deleting: deletingId === item.id }), { key: item.id }))}</div>}
    </section>
  )
}
