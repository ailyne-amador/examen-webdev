import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [navigate, user])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await login(form)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Sobre VentasFix">
        <div className="login-orbit login-orbit-top" aria-hidden="true" />
        <div className="login-orbit login-orbit-bottom" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="login-brand-mark">V</span>
          <span className="text-lg font-semibold tracking-[-0.02em]">VentasFix</span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-7 text-sm font-medium text-[#9fb8ff]">Backoffice para operar mejor</p>
          <h1 className="login-title">Un lugar claro para tomar decisiones rápidas.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#b7c3d5]">Ordena usuarios, productos y clientes sin perder de vista lo importante.</p>
          <div className="mt-12 flex items-center gap-4 text-sm text-[#d5deed]">
            <span className="login-signal" aria-hidden="true" />
            <span>Todo tu equipo, con el mismo ritmo.</span>
          </div>
        </div>

        <div className="relative text-xs text-[#8291a8]">
          <span>VentasFix / Gestión simple</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="mb-14 flex items-center gap-3 lg:hidden"><span className="login-mobile-mark">V</span><span className="font-semibold tracking-[-0.02em]">VentasFix</span></div>
          <div className="mb-10">
            <p className="mb-4 text-sm font-medium text-[#647184]">Acceso al backoffice</p>
            <h2 className="login-form-title">Hola de nuevo.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#647184]">Ingresa con tu correo corporativo para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#263446]">Correo corporativo</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="nombre@ventasfix.cl" className="login-input" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#263446]">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={handleChange} placeholder="Tu contraseña" className="login-input" />
            </div>

            {error && <p role="alert" className="login-error">{error}</p>}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Ingresando…' : 'Entrar'}
            </button>
          </form>
          <p className="mt-8 text-xs leading-5 text-[#8793a2]">Este espacio está reservado para usuarios autorizados.</p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
