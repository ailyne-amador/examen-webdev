// Componentes y utilidades de UI compartidas por las páginas de la app.
// Centralizan formularios, mensajes, listados y navegación para no repetir código.
import { cloneElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'

// Hook que maneja el estado de un formulario: valores, mensaje de error y cambios.
// `handleChange` usa el atributo `name` del input para saber qué campo actualizar.
export function useForm(initial) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  function handleChange(event) {
    // Copia el formulario actual y pisa solo el campo que cambió
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('') // Limpia el error en cuanto el usuario corrige
  }
  return { form, setForm, error, setError, handleChange }
}

// Sección visible mientras se cargan datos (aria-live lo anuncia a lectores de pantalla)
export function LoadingSection({ children }) {
  return <section className="loading-surface" aria-live="polite">{children}</section>
}

// Muestra el mensaje de error solo si existe; si no, no renderiza nada
export function ErrorMessage({ error, className = '' }) {
  return error ? <p className={`error-message ${className}`} role="alert">{error}</p> : null
}

// Par etiqueta/valor para las fichas de detalle; muestra "—" si el valor está vacío
export function DataItem({ label, value }) {
  return <div className="data-item"><dt className="data-label">{label}</dt><dd className="data-value">{value || '—'}</dd></div>
}

// Renderiza un campo del formulario a partir de su configuración:
// input normal o textarea según `field.as`, siempre como requerido
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

// Botón "volver" que navega a la ruta indicada
export function BackLink({ to, children }) {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(to)} className="back-link focus-ring"><span aria-hidden="true">←</span> {children}</button>
}

// Encabezado decorativo de los formularios: marca, etiqueta, título y descripción
export function FormIntro({ mark, kicker, title, copy }) {
  return <div className="form-intro"><div className="form-intro-mark" aria-hidden="true">{mark}</div><div><p className="form-intro-kicker">{kicker}</p><h2 className="form-intro-title">{title}</h2><p className="form-intro-copy">{copy}</p></div></div>
}

// Listado genérico de entidades: carga los datos del endpoint, permite eliminar
// (solo si se pasa `deleteConfirm`) y dibuja cada ítem con la tarjeta `renderCard`.
// Lo usan las páginas de usuarios, productos y clientes
export function ListPage({ endpoint, singular, plural, title, kicker, emptyText, deleteConfirm, renderCard }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  // Carga inicial del listado. La bandera `active` evita actualizar el estado
  // si el componente se desmonta antes de que responda la API
  useEffect(() => {
    let active = true
    api.get(endpoint)
      .then(({ data }) => { if (active) setItems(data) })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, `No pudimos cargar los ${plural}. Intenta nuevamente.`)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [endpoint, plural])

  // Pide confirmación, borra en la API y quita el ítem de la lista local
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
