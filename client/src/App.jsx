import { BrowserRouter, Navigate, Outlet, Route, Routes, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ClientesPage, { ClienteForm } from './pages/ClientesPage'
import ProductosPage, { ProductoForm } from './pages/ProductosPage'
import UsuariosPage, { UsuarioDetail, UsuarioForm, UsuarioIdentityEdit } from './pages/UsuariosPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'

const entities = [
  { path: 'dashboard', label: 'Resumen', title: 'Resumen operativo', element: <DashboardPage /> },
  { path: 'usuarios', label: 'Usuarios', title: 'Usuarios', element: <UsuariosPage />,
    extra: [
      { path: 'usuarios/nuevo', element: <UsuarioForm /> },
      { path: 'usuarios/:id/identidad', element: <UsuarioIdentityEdit /> },
      { path: 'usuarios/:id', element: <UsuarioDetail /> },
    ] },
  { path: 'productos', label: 'Productos', title: 'Productos', element: <ProductosPage />,
    extra: [
      { path: 'productos/nuevo', element: <ProductoForm /> },
      { path: 'productos/:id', element: <ProductoForm /> },
    ] },
  { path: 'clientes', label: 'Clientes', title: 'Clientes', element: <ClientesPage />,
    extra: [
      { path: 'clientes/nuevo', element: <ClienteForm /> },
      { path: 'clientes/:id', element: <ClienteForm /> },
    ] },
]

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const current = location.pathname.split('/')[1]
  const section = entities.find((entity) => entity.path === current) || { label: 'Cuenta', title: 'Tu cuenta' }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  async function handleLogout() {
    closeMobileMenu()
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-frame">
      <aside className="app-rail fixed inset-y-0 left-0 hidden w-60 flex-col px-5 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2"><span className="brand-mark">V</span><div><p className="brand-name">VentasFix</p><p className="brand-subtitle">Backoffice</p></div></div>
        <nav className="rail-nav" aria-label="Navegación principal">
          {entities.map(({ path, label }) => <NavLink key={path} to={`/${path}`} className={({ isActive }) => `rail-link ${isActive ? 'rail-link-active' : ''}`}><span className="rail-dot" />{label}</NavLink>)}
        </nav>
        <div className="rail-user mt-auto"><button type="button" onClick={() => navigate('/perfil')} className="rail-user-link focus-ring"><p className="rail-user-name">{user?.nombre}</p><p className="rail-user-email">{user?.email}</p></button><button onClick={handleLogout} className="rail-logout focus-ring">Cerrar sesión</button></div>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div className="app-header-leading">
            <button type="button" className="mobile-menu-button focus-ring lg:hidden" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
              <span className={`mobile-menu-symbol ${mobileMenuOpen ? 'mobile-menu-symbol-open' : ''}`} aria-hidden="true" />
            </button>
            <div><p className="app-breadcrumb">VentasFix / {section.label}</p><h1 className="app-header-title">{section.title}</h1></div>
          </div>
          <button type="button" onClick={() => navigate('/perfil')} className="header-user profile-header-user focus-ring" aria-label="Abrir tu perfil"><span className="header-user-copy hidden sm:block"><span className="header-user-name">{user?.nombre}</span><span className="header-user-role">Administrador</span></span><span className="header-avatar">{user?.nombre?.charAt(0).toUpperCase()}</span></button>
        </header>
        {mobileMenuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegación móvil">
          <div className="mobile-nav-links">
            {entities.map(({ path, label }) => <NavLink key={path} to={`/${path}`} onClick={closeMobileMenu} className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}><span className="rail-dot" />{label}</NavLink>)}
          </div>
          <div className="mobile-nav-account">
            <button type="button" onClick={() => { closeMobileMenu(); navigate('/perfil') }} className="mobile-nav-account-link focus-ring"><span>{user?.nombre}</span><span>{user?.email}</span></button>
            <button type="button" onClick={handleLogout} className="mobile-nav-logout focus-ring">Cerrar sesión</button>
          </div>
        </nav>}
        <div className="app-content"><Outlet /></div>
      </main>
    </div>
  )
}

function App() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route index element={<Navigate to="/dashboard" replace />} />{entities.map(({ path, element, extra = [] }) => [<Route key={path} path={path} element={element} />, ...extra.map((sub) => <Route key={sub.path} path={sub.path} element={sub.element} />)])}<Route path="perfil" element={<ProfilePage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>
}

export default App
