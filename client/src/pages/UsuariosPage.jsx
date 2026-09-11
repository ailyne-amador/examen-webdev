import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'
import { BackLink, DataItem, ErrorMessage, FieldInput, FormIntro, ListPage, LoadingSection, useForm } from '../components/ui'

const emptyUser = { rut: '', nombre: '', apellido: '', email: '', password: '' }
const userFields = [
  { key: 'rut', label: 'RUT' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
]

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value)) : '—'
}

function UserCard({ user }) {
  const navigate = useNavigate()
  function openUser() { navigate(`/usuarios/${user.id}`) }
  function handleKeyDown(event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openUser() } }

  return <article role="link" tabIndex={0} onClick={openUser} onKeyDown={handleKeyDown} className="entity-card entity-card-clickable focus-ring"><div className="flex items-start gap-4"><span className="entity-avatar" aria-hidden="true">{user.nombre.charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 className="entity-title">{user.nombre} {user.apellido}</h2><p className="entity-subtitle">{user.email}</p></div></div><dl className="data-grid sm:grid-cols-2"><DataItem label="RUT" value={user.rut} /><DataItem label="Nombre completo" value={`${user.nombre} ${user.apellido}`} /><DataItem label="Correo" value={user.email} /></dl><span className="user-card-hint">Ver ficha completa <span aria-hidden="true">→</span></span></article>
}

export function UsuarioForm() {
  const navigate = useNavigate()
  const { form, error, setError, handleChange } = useForm(emptyUser)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { await api.post('/usuarios', form); navigate('/usuarios', { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos registrar el usuario. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  return <section className="form-page"><BackLink to="/usuarios">Volver a usuarios</BackLink><FormIntro mark="U" kicker="Nuevo acceso" title="Añadir usuario" copy="Registra una persona para darle acceso al backoffice de VentasFix." /><form onSubmit={handleSubmit} className="form-surface"><div className="form-section"><h3>Datos del usuario</h3><p>Todos los campos son obligatorios.</p></div><div className="form-grid">{userFields.map((field) => <FieldInput key={field.key} field={field} form={form} onChange={handleChange} />)}<FieldInput field={{ key: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' }} form={form} onChange={handleChange} /></div><ErrorMessage error={error} className="mt-6" /><div className="form-actions"><button type="button" onClick={() => navigate('/usuarios')} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving} className="action-button focus-ring">{saving ? 'Guardando…' : 'Registrar usuario'}</button></div></form></section>
}

export function UsuarioDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/usuarios/${id}`).then(({ data }) => { if (active) setUser(data) }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este usuario.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${user.nombre} ${user.apellido}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try { await api.delete(`/usuarios/${id}`); navigate('/usuarios', { replace: true }) } catch (deleteError) { setError(getErrorMessage(deleteError, 'No pudimos eliminar el usuario. Intenta nuevamente.')); setDeleting(false) }
  }

  if (loading) return <LoadingSection>Cargando datos del usuario…</LoadingSection>
  if (!user) return <section className="form-page"><BackLink to="/usuarios">Volver a usuarios</BackLink><ErrorMessage error={error || 'Usuario no encontrado.'} /></section>

  return <section className="form-page"><BackLink to="/usuarios">Volver a usuarios</BackLink><FormIntro mark={user.nombre.charAt(0).toUpperCase()} kicker="Ficha de usuario" title={`${user.nombre} ${user.apellido}`} copy="Consulta la información registrada y administra sus datos de identidad." /><div className="form-surface"><div className="form-section"><h3>Información del usuario</h3><p>Datos registrados para este acceso al backoffice.</p></div><dl className="data-grid sm:grid-cols-2"><DataItem label="RUT" value={user.rut} /><DataItem label="Nombre" value={user.nombre} /><DataItem label="Apellido" value={user.apellido} /><DataItem label="Correo electrónico" value={user.email} /><DataItem label="Registrado el" value={formatDate(user.createdAt)} /><DataItem label="Última actualización" value={formatDate(user.updatedAt)} /></dl><ErrorMessage error={error} className="mt-6" /><div className="user-detail-actions"><div><button type="button" onClick={() => navigate(`/usuarios/${id}/identidad`)} className="outline-button focus-ring">Editar datos de identidad</button><p className="sensitive-warning">Información sensible: edita estos datos bajo tu propia responsabilidad.</p></div><button type="button" onClick={handleDelete} disabled={deleting} className="danger-button focus-ring">{deleting ? 'Eliminando…' : 'Eliminar usuario'}</button></div></div></section>
}

export function UsuarioIdentityEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('name')
  const { form, setForm, error, setError, handleChange } = useForm({ nombre: '', apellido: '', rut: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    api.get(`/usuarios/${id}`).then(({ data }) => { if (active) { setUser(data); setForm({ nombre: data.nombre, apellido: data.apellido, rut: data.rut }) } }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este usuario.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, setForm, setError])

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    const changes = mode === 'name' ? { nombre: form.nombre, apellido: form.apellido } : { rut: form.rut }
    try { await api.put(`/usuarios/${id}`, changes); navigate(`/usuarios/${id}`, { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos guardar los datos de identidad. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  if (loading) return <LoadingSection>Cargando datos del usuario…</LoadingSection>
  if (!user) return <section className="form-page"><BackLink to="/usuarios">Volver a usuarios</BackLink><ErrorMessage error={error || 'Usuario no encontrado.'} /></section>

  return <section className="form-page"><BackLink to={`/usuarios/${id}`}>Volver a ficha</BackLink><FormIntro mark="!" kicker="Edición sensible" title="Datos de identidad" copy={`Cambia el nombre completo o el RUT de ${user.nombre} ${user.apellido}.`} /><form onSubmit={handleSubmit} className="form-surface"><div className="identity-options" role="group" aria-label="Dato de identidad a editar"><button type="button" onClick={() => setMode('name')} className={`identity-option ${mode === 'name' ? 'identity-option-active' : ''} focus-ring`}><strong>Editar nombre completo</strong><small>Nombre y apellido</small></button><button type="button" onClick={() => setMode('rut')} className={`identity-option ${mode === 'rut' ? 'identity-option-active' : ''} focus-ring`}><strong>Editar RUT</strong><small>Identificador legal</small></button></div><div className="form-section"><h3>{mode === 'name' ? 'Nombre completo' : 'RUT'}</h3><p>Este cambio quedará registrado en la ficha del usuario.</p></div><div className="form-grid">{mode === 'name' ? <><FieldInput field={{ key: 'nombre', label: 'Nombre' }} form={form} onChange={handleChange} /><FieldInput field={{ key: 'apellido', label: 'Apellido' }} form={form} onChange={handleChange} /></> : <FieldInput field={{ key: 'rut', label: 'RUT' }} form={form} onChange={handleChange} />}</div><ErrorMessage error={error} className="mt-6" /><div className="form-actions"><button type="button" onClick={() => navigate(`/usuarios/${id}`)} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving} className="action-button focus-ring">{saving ? 'Guardando…' : 'Guardar cambios'}</button></div></form></section>
}

export default function UsuariosPage() {
  return <ListPage endpoint="/usuarios" singular="usuario" plural="usuarios" title="Usuarios" kicker="Equipo y accesos" emptyText="Agrega el primero para comenzar a gestionar los accesos." renderCard={(user) => <UserCard user={user} />} />
}
