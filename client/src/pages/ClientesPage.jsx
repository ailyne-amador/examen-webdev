import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

const emptyForm = { rutEmpresa: '', rubro: '', razonSocial: '', telefono: '', direccion: '', nombreContacto: '', emailContacto: '' }
const clienteFields = [
  { key: 'rutEmpresa', label: 'RUT empresa' },
  { key: 'rubro', label: 'Rubro' },
  { key: 'razonSocial', label: 'Razón social' },
  { key: 'telefono', label: 'Teléfono', type: 'tel' },
  { key: 'direccion', label: 'Dirección', wide: true },
  { key: 'nombreContacto', label: 'Nombre de contacto' },
  { key: 'emailContacto', label: 'Correo de contacto', type: 'email' },
]

function getErrorMessage(error, fallback) { return error.response?.data?.message || fallback }

function ClienteDato({ label, value }) {
  return <div className="data-item"><dt className="data-label">{label}</dt><dd className="data-value">{value}</dd></div>
}

function ClienteInput({ field, form, onChange }) {
  return <label className={`form-label ${field.wide ? 'form-grid-wide' : ''}`}>{field.label}<input name={field.key} type={field.type || 'text'} value={form[field.key]} onChange={onChange} required className="form-input" /></label>
}

function ClienteCard({ cliente }) {
  const navigate = useNavigate()
  return <article className="entity-card"><div className="flex items-start gap-4"><span className="entity-avatar" aria-hidden="true">{cliente.razonSocial.charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 className="entity-title">{cliente.razonSocial}</h2><p className="entity-subtitle">{cliente.rubro}</p></div></div><dl className="data-grid sm:grid-cols-2">{clienteFields.map((field) => <ClienteDato key={field.key} label={field.label} value={cliente[field.key]} />)}</dl><button type="button" onClick={() => navigate(`/clientes/${cliente.id}`)} className="outline-button mt-6 w-full focus-ring">Editar cliente</button></article>
}

function ClientesList() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadClientes() {
      try { const { data } = await api.get('/clientes'); if (active) setClientes(data) } catch (loadError) { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar los clientes. Intenta nuevamente.')) } finally { if (active) setLoading(false) }
    }
    loadClientes()
    return () => { active = false }
  }, [])

  if (loading) return <section className="loading-surface" aria-live="polite">Cargando clientes…</section>
  return <section><div className="page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="page-kicker">Cartera comercial</p><h2 className="page-title">Clientes</h2><p className="page-count">{clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}</p></div><button type="button" onClick={() => navigate('/clientes/nuevo')} className="action-button focus-ring">Añadir cliente</button></div>{error && <p className="error-message mb-6" role="alert">{error}</p>}{clientes.length === 0 && !error && <div className="empty-state"><h3>Aún no hay clientes</h3><p>Agrega el primero para comenzar a gestionar tu cartera.</p></div>}{clientes.length > 0 && <div className="entity-grid">{clientes.map((cliente) => <ClienteCard key={cliente.id} cliente={cliente} />)}</div>}</section>
}

export function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()
  const isCreate = pathname.endsWith('/nuevo')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isCreate) return undefined
    let active = true
    api.get(`/clientes/${id}`).then(({ data }) => { if (active) setForm({ ...emptyForm, ...data }) }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este cliente.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isCreate])

  function handleChange(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setError('') }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { if (isCreate) await api.post('/clientes', form); else await api.put(`/clientes/${id}`, form); navigate('/clientes', { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos guardar el cliente. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${form.razonSocial}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try { await api.delete(`/clientes/${id}`); navigate('/clientes', { replace: true }) } catch (deleteError) { setError(getErrorMessage(deleteError, 'No pudimos eliminar el cliente. Intenta nuevamente.')); setDeleting(false) }
  }

  if (loading) return <section className="loading-surface" aria-live="polite">Cargando datos del cliente…</section>
  return <section className="form-page"><button type="button" onClick={() => navigate('/clientes')} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a clientes</button><div className="form-intro"><div className="form-intro-mark" aria-hidden="true">{(form.razonSocial || 'C').charAt(0).toUpperCase()}</div><div><p className="form-intro-kicker">{isCreate ? 'Nueva empresa' : 'Ficha de cliente'}</p><h2 className="form-intro-title">{isCreate ? 'Añadir cliente' : form.razonSocial || 'Editar cliente'}</h2><p className="form-intro-copy">{isCreate ? 'Registra una empresa para incorporarla a tu cartera comercial.' : 'Actualiza la información comercial y de contacto de esta empresa.'}</p></div></div><form onSubmit={handleSubmit} className="form-surface"><div className="form-section"><h3>Datos de la empresa</h3><p>Todos los campos son obligatorios.</p></div><div className="form-grid">{clienteFields.slice(0, 5).map((field) => <ClienteInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div><div className="form-section mt-8"><h3>Persona de contacto</h3><p>El contacto principal para comunicaciones comerciales.</p></div><div className="form-grid">{clienteFields.slice(5).map((field) => <ClienteInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div>{error && <p className="error-message mt-6" role="alert">{error}</p>}<div className="form-actions">{!isCreate ? <button type="button" onClick={handleDelete} disabled={deleting || saving} className="danger-button focus-ring">{deleting ? 'Eliminando…' : 'Eliminar cliente'}</button> : <span /> }<div className="form-actions-right"><button type="button" onClick={() => navigate('/clientes')} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving || deleting} className="action-button focus-ring">{saving ? 'Guardando…' : isCreate ? 'Crear cliente' : 'Guardar cambios'}</button></div></div></form></section>
}

export default function ClientesPage() { return <ClientesList /> }
