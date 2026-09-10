import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

const emptyUser = { rut: '', nombre: '', apellido: '', email: '', password: '' }
const userFields = [
  { key: 'rut', label: 'RUT' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
]

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value)) : '—'
}

function UserData({ label, value }) {
  return <div className="data-item"><dt className="data-label">{label}</dt><dd className="data-value">{value || '—'}</dd></div>
}

function UserInput({ field, form, onChange }) {
  return <label className="form-label">{field.label}<input name={field.key} type={field.type || 'text'} value={form[field.key]} onChange={onChange} required className="form-input" autoComplete={field.autoComplete} /></label>
}

function UserCard({ user }) {
  const navigate = useNavigate()
  function openUser() { navigate(`/usuarios/${user.id}`) }
  function handleKeyDown(event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openUser() } }

  return <article role="link" tabIndex={0} onClick={openUser} onKeyDown={handleKeyDown} className="entity-card entity-card-clickable focus-ring"><div className="flex items-start gap-4"><span className="entity-avatar" aria-hidden="true">{user.nombre.charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 className="entity-title">{user.nombre} {user.apellido}</h2><p className="entity-subtitle">{user.email}</p></div></div><dl className="data-grid sm:grid-cols-2"><UserData label="RUT" value={user.rut} /><UserData label="Nombre completo" value={`${user.nombre} ${user.apellido}`} /><UserData label="Correo" value={user.email} /></dl><span className="user-card-hint">Ver ficha completa <span aria-hidden="true">→</span></span></article>
}

function UsuariosList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadUsers() {
      try { const { data } = await api.get('/usuarios'); if (active) setUsers(data) } catch (loadError) { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar los usuarios. Intenta nuevamente.')) } finally { if (active) setLoading(false) }
    }
    loadUsers()
    return () => { active = false }
  }, [])

  if (loading) return <section className="loading-surface" aria-live="polite">Cargando usuarios…</section>
  return <section><div className="page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="page-kicker">Equipo y accesos</p><h2 className="page-title">Usuarios</h2><p className="page-count">{users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}</p></div><button type="button" onClick={() => navigate('/usuarios/nuevo')} className="action-button focus-ring">Añadir usuario</button></div>{error && <p className="error-message mb-6" role="alert">{error}</p>}{users.length === 0 && !error && <div className="empty-state"><h3>Aún no hay usuarios</h3><p>Agrega el primero para comenzar a gestionar los accesos.</p></div>}{users.length > 0 && <div className="entity-grid">{users.map((user) => <UserCard key={user.id} user={user} />)}</div>}</section>
}

export function UsuarioForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyUser)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setError('') }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { await api.post('/usuarios', form); navigate('/usuarios', { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos registrar el usuario. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  return <section className="form-page"><button type="button" onClick={() => navigate('/usuarios')} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a usuarios</button><div className="form-intro"><div className="form-intro-mark" aria-hidden="true">U</div><div><p className="form-intro-kicker">Nuevo acceso</p><h2 className="form-intro-title">Añadir usuario</h2><p className="form-intro-copy">Registra una persona para darle acceso al backoffice de VentasFix.</p></div></div><form onSubmit={handleSubmit} className="form-surface"><div className="form-section"><h3>Datos del usuario</h3><p>Todos los campos son obligatorios.</p></div><div className="form-grid">{userFields.map((field) => <UserInput key={field.key} field={field} form={form} onChange={handleChange} />)}<UserInput field={{ key: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' }} form={form} onChange={handleChange} /></div>{error && <p className="error-message mt-6" role="alert">{error}</p>}<div className="form-actions"><button type="button" onClick={() => navigate('/usuarios')} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving} className="action-button focus-ring">{saving ? 'Guardando…' : 'Registrar usuario'}</button></div></form></section>
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

  if (loading) return <section className="loading-surface" aria-live="polite">Cargando datos del usuario…</section>
  if (!user) return <section className="form-page"><button type="button" onClick={() => navigate('/usuarios')} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a usuarios</button><p className="error-message" role="alert">{error || 'Usuario no encontrado.'}</p></section>

  return <section className="form-page"><button type="button" onClick={() => navigate('/usuarios')} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a usuarios</button><div className="form-intro"><div className="form-intro-mark" aria-hidden="true">{user.nombre.charAt(0).toUpperCase()}</div><div><p className="form-intro-kicker">Ficha de usuario</p><h2 className="form-intro-title">{user.nombre} {user.apellido}</h2><p className="form-intro-copy">Consulta la información registrada y administra sus datos de identidad.</p></div></div><div className="form-surface"><div className="form-section"><h3>Información del usuario</h3><p>Datos registrados para este acceso al backoffice.</p></div><dl className="data-grid sm:grid-cols-2"><UserData label="RUT" value={user.rut} /><UserData label="Nombre" value={user.nombre} /><UserData label="Apellido" value={user.apellido} /><UserData label="Correo electrónico" value={user.email} /><UserData label="Registrado el" value={formatDate(user.createdAt)} /><UserData label="Última actualización" value={formatDate(user.updatedAt)} /></dl>{error && <p className="error-message mt-6" role="alert">{error}</p>}<div className="user-detail-actions"><div><button type="button" onClick={() => navigate(`/usuarios/${id}/identidad`)} className="outline-button focus-ring">Editar datos de identidad</button><p className="sensitive-warning">Información sensible: edita estos datos bajo tu propia responsabilidad.</p></div><button type="button" onClick={handleDelete} disabled={deleting} className="danger-button focus-ring">{deleting ? 'Eliminando…' : 'Eliminar usuario'}</button></div></div></section>
}

export function UsuarioIdentityEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('name')
  const [form, setForm] = useState({ nombre: '', apellido: '', rut: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/usuarios/${id}`).then(({ data }) => { if (active) { setUser(data); setForm({ nombre: data.nombre, apellido: data.apellido, rut: data.rut }) } }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este usuario.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  function handleChange(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setError('') }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    const changes = mode === 'name' ? { nombre: form.nombre, apellido: form.apellido } : { rut: form.rut }
    try { await api.put(`/usuarios/${id}`, changes); navigate(`/usuarios/${id}`, { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos guardar los datos de identidad. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  if (loading) return <section className="loading-surface" aria-live="polite">Cargando datos del usuario…</section>
  if (!user) return <section className="form-page"><button type="button" onClick={() => navigate('/usuarios')} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a usuarios</button><p className="error-message" role="alert">{error || 'Usuario no encontrado.'}</p></section>

  return <section className="form-page"><button type="button" onClick={() => navigate(`/usuarios/${id}`)} className="back-link focus-ring"><span aria-hidden="true">←</span> Volver a ficha</button><div className="form-intro"><div className="form-intro-mark" aria-hidden="true">!</div><div><p className="form-intro-kicker">Edición sensible</p><h2 className="form-intro-title">Datos de identidad</h2><p className="form-intro-copy">Cambia el nombre completo o el RUT de {user.nombre} {user.apellido}.</p></div></div><form onSubmit={handleSubmit} className="form-surface"><div className="identity-options" role="group" aria-label="Dato de identidad a editar"><button type="button" onClick={() => setMode('name')} className={`identity-option ${mode === 'name' ? 'identity-option-active' : ''} focus-ring`}><strong>Editar nombre completo</strong><small>Nombre y apellido</small></button><button type="button" onClick={() => setMode('rut')} className={`identity-option ${mode === 'rut' ? 'identity-option-active' : ''} focus-ring`}><strong>Editar RUT</strong><small>Identificador legal</small></button></div><div className="form-section"><h3>{mode === 'name' ? 'Nombre completo' : 'RUT'}</h3><p>Este cambio quedará registrado en la ficha del usuario.</p></div><div className="form-grid">{mode === 'name' ? <><UserInput field={{ key: 'nombre', label: 'Nombre' }} form={form} onChange={handleChange} /><UserInput field={{ key: 'apellido', label: 'Apellido' }} form={form} onChange={handleChange} /></> : <UserInput field={{ key: 'rut', label: 'RUT' }} form={form} onChange={handleChange} />}</div>{error && <p className="error-message mt-6" role="alert">{error}</p>}<div className="form-actions"><button type="button" onClick={() => navigate(`/usuarios/${id}`)} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving} className="action-button focus-ring">{saving ? 'Guardando…' : 'Guardar cambios'}</button></div></form></section>
}

export default function UsuariosPage() { return <UsuariosList /> }
