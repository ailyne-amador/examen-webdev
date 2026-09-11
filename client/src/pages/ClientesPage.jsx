import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'
import { BackLink, DataItem, ErrorMessage, FieldInput, FormIntro, ListPage, LoadingSection, useForm } from '../components/ui'

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

function ClienteCard({ cliente }) {
  const navigate = useNavigate()
  return <article className="entity-card"><div className="flex items-start gap-4"><span className="entity-avatar" aria-hidden="true">{cliente.razonSocial.charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 className="entity-title">{cliente.razonSocial}</h2><p className="entity-subtitle">{cliente.rubro}</p></div></div><dl className="data-grid sm:grid-cols-2">{clienteFields.map((field) => <DataItem key={field.key} label={field.label} value={cliente[field.key]} />)}</dl><button type="button" onClick={() => navigate(`/clientes/${cliente.id}`)} className="outline-button mt-6 w-full focus-ring">Editar cliente</button></article>
}

export function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()
  const isCreate = pathname.endsWith('/nuevo')
  const { form, setForm, error, setError, handleChange } = useForm(emptyForm)
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isCreate) return undefined
    let active = true
    api.get(`/clientes/${id}`).then(({ data }) => { if (active) setForm({ ...emptyForm, ...data }) }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este cliente.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isCreate, setForm, setError])

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { if (isCreate) await api.post('/clientes', form); else await api.put(`/clientes/${id}`, form); navigate('/clientes', { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos guardar el cliente. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${form.razonSocial}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try { await api.delete(`/clientes/${id}`); navigate('/clientes', { replace: true }) } catch (deleteError) { setError(getErrorMessage(deleteError, 'No pudimos eliminar el cliente. Intenta nuevamente.')); setDeleting(false) }
  }

  if (loading) return <LoadingSection>Cargando datos del cliente…</LoadingSection>
  return <section className="form-page"><BackLink to="/clientes">Volver a clientes</BackLink><FormIntro mark={(form.razonSocial || 'C').charAt(0).toUpperCase()} kicker={isCreate ? 'Nueva empresa' : 'Ficha de cliente'} title={isCreate ? 'Añadir cliente' : form.razonSocial || 'Editar cliente'} copy={isCreate ? 'Registra una empresa para incorporarla a tu cartera comercial.' : 'Actualiza la información comercial y de contacto de esta empresa.'} /><form onSubmit={handleSubmit} className="form-surface"><div className="form-section"><h3>Datos de la empresa</h3><p>Todos los campos son obligatorios.</p></div><div className="form-grid">{clienteFields.slice(0, 5).map((field) => <FieldInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div><div className="form-section mt-8"><h3>Persona de contacto</h3><p>El contacto principal para comunicaciones comerciales.</p></div><div className="form-grid">{clienteFields.slice(5).map((field) => <FieldInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div><ErrorMessage error={error} className="mt-6" /><div className="form-actions">{!isCreate ? <button type="button" onClick={handleDelete} disabled={deleting || saving} className="danger-button focus-ring">{deleting ? 'Eliminando…' : 'Eliminar cliente'}</button> : <span /> }<div className="form-actions-right"><button type="button" onClick={() => navigate('/clientes')} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving || deleting} className="action-button focus-ring">{saving ? 'Guardando…' : isCreate ? 'Crear cliente' : 'Guardar cambios'}</button></div></div></form></section>
}

export default function ClientesPage() {
  return <ListPage endpoint="/clientes" singular="cliente" plural="clientes" title="Clientes" kicker="Cartera comercial" emptyText="Agrega el primero para comenzar a gestionar tu cartera." renderCard={(cliente) => <ClienteCard cliente={cliente} />} />
}
