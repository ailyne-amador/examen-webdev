// Página de perfil: el usuario autenticado ve sus datos y puede cambiar
// su correo o contraseña (solo esas dos credenciales)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

// Estado inicial vacío mientras se cargan los datos reales del usuario
const emptyProfile = { rut: '', nombre: '', apellido: '', email: '' }

// Mini-formulario reutilizable para editar un solo dato: correo o contraseña.
// `mode` define cuál se edita y ajusta etiquetas, tipo de input y validaciones
function ProfileEditForm({ mode, initialValue, loading, onCancel, onSubmit }) {
  const isEmail = mode === 'email'
  const [value, setValue] = useState(initialValue)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="profile-edit-heading">
        <div>
          <h4>{isEmail ? 'Editar correo' : 'Editar contraseña'}</h4>
          <p>{isEmail ? 'Usa tu nuevo correo corporativo para iniciar sesión.' : 'Elige una contraseña de al menos 6 caracteres.'}</p>
        </div>
      </div>
      <div className="profile-fields profile-edit-fields">
        <div className="profile-field profile-field-wide">
          <label htmlFor={`profile-${mode}`}>{isEmail ? 'Correo corporativo' : 'Nueva contraseña'}</label>
          <input
            id={`profile-${mode}`}
            type={isEmail ? 'email' : 'password'}
            autoComplete={isEmail ? 'email' : 'new-password'}
            minLength={isEmail ? undefined : 6}
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
      </div>
      <div className="profile-actions">
        <button type="button" className="profile-cancel" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="profile-save" disabled={loading}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </form>
  )
}

function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(emptyProfile)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [editMode, setEditMode] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Carga los datos del usuario autenticado; `active` evita setState si se desmonta
  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const { data } = await api.get(`/usuarios/${user.id}`)
        if (active) setProfile({ ...emptyProfile, ...data })
      } catch {
        if (active) setError('No pudimos cargar tus datos. Intenta nuevamente.')
      } finally {
        if (active) setLoadingProfile(false)
      }
    }

    loadProfile()
    return () => { active = false }
  }, [user.id])

  // Activa el modo de edición ('email' o 'password') y limpia mensajes previos
  function startEditing(mode) {
    setEditMode(mode)
    setError('')
    setSaved(false)
  }

  // Guarda el cambio en la API y actualiza también el contexto de sesión
  // (si cambió el correo, el usuario logueado debe reflejarlo)
  async function handleSubmit(value) {
    try {
      const updated = await updateUser(user.id, { [editMode]: value })
      setProfile((current) => ({ ...current, ...updated }))
      setEditMode(null)
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  if (loadingProfile) {
    return <section className="profile-loading" aria-live="polite">Cargando tus datos…</section>
  }

  return (
    <section className="profile-page">
      <button type="button" className="profile-back" onClick={() => navigate(-1)}>
        <span aria-hidden="true">←</span> Volver
      </button>

      <div className="profile-intro">
        <div className="profile-avatar" aria-hidden="true">{profile.nombre?.charAt(0).toUpperCase()}</div>
        <div>
          <p className="profile-kicker">Cuenta personal</p>
          <h2 className="profile-title">Tu perfil</h2>
          <p className="profile-description">Consulta tus datos y actualiza solo las credenciales de tu cuenta.</p>
        </div>
      </div>

      <div className="profile-layout">
        <article className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h3>{editMode ? (editMode === 'email' ? 'Editar correo' : 'Editar contraseña') : 'Datos de tu cuenta'}</h3>
              <p>{editMode ? 'Guarda el cambio cuando termines.' : 'Elige qué dato de acceso quieres actualizar.'}</p>
            </div>
            <span className="profile-status">Usuario activo</span>
          </div>

          {error && <p className="profile-message profile-message-error" role="alert">{error}</p>}
          {saved && <p className="profile-message profile-message-success" role="status">Cambios guardados.</p>}

          {editMode ? (
            <ProfileEditForm
              key={editMode}
              mode={editMode}
              initialValue={editMode === 'email' ? profile.email : ''}
              loading={loading}
              onCancel={() => setEditMode(null)}
              onSubmit={handleSubmit}
            />
          ) : (
            <>
              {/* Vista de solo lectura de los datos de la cuenta */}
              <dl className="profile-details">
                <div><dt>Nombre completo</dt><dd>{profile.nombre} {profile.apellido}</dd></div>
                <div><dt>RUT</dt><dd>{profile.rut}</dd></div>
                <div><dt>Correo corporativo</dt><dd>{profile.email}</dd></div>
              </dl>
              <div className="profile-options" aria-label="Opciones de cuenta">
                <button type="button" className="profile-option" onClick={() => startEditing('password')}>
                  <span><strong>Editar contraseña</strong><small>Actualiza tu clave de acceso.</small></span>
                  <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="profile-option" onClick={() => startEditing('email')}>
                  <span><strong>Editar correo</strong><small>Cambia el correo usado para ingresar.</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </>
          )}
        </article>

        {/* Panel lateral informativo: explica qué se puede editar desde aquí */}
        <aside className="profile-aside">
          <span className="profile-aside-mark" aria-hidden="true">V</span>
          <h3>Una cuenta al día</h3>
          <p>Tu correo se usa para iniciar sesión y recibir comunicaciones del backoffice.</p>
          <div className="profile-aside-rule" />
          <p className="profile-aside-footnote">Desde aquí solo puedes editar tu correo y contraseña.</p>
        </aside>
      </div>
    </section>
  )
}

export default ProfilePage
