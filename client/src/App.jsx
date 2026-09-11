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

const sections = {
  dashboard: { label: 'Resumen', title: 'Resumen operativo', description: 'Una vista rápida del estado de tu negocio.' },
  usuarios: { label: 'Usuarios', title: 'Usuarios', description: 'Administra los accesos del equipo.' },
  productos: { label: 'Productos', title: 'Productos', description: 'Controla tu catálogo y stock.' },
  clientes: { label: 'Clientes', title: 'Clientes', description: 'Consulta y gestiona tu cartera.' },
}

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const currentSection = location.pathname.split('/')[1] || 'dashboard'
  const section = sections[currentSection] || { label: 'Cuenta', title: 'Tu cuenta', description: '' }

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
          {Object.entries(sections).map(([key, item]) => <NavLink key={key} to={`/${key}`} className={({ isActive }) => `rail-link ${isActive ? 'rail-link-active' : ''}`}><span className="rail-dot" />{item.label}</NavLink>)}
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
            {Object.entries(sections).map(([key, item]) => <NavLink key={key} to={`/${key}`} onClick={closeMobileMenu} className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}><span className="rail-dot" />{item.label}</NavLink>)}
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

function WorkspacePage() {
  const location = useLocation()
  const section = sections[location.pathname.split('/')[1]] || sections.dashboard
  return <section className="workspace-placeholder"><div className="workspace-placeholder-mark">{section.label.slice(0, 2).toUpperCase()}</div><h2>{section.title}</h2><p>{section.description} Esta sección estará disponible en la siguiente fase.</p></section>
}

function App() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route index element={<Navigate to="/dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} /><Route path="usuarios" element={<UsuariosPage />} /><Route path="usuarios/nuevo" element={<UsuarioForm />} /><Route path="usuarios/:id/identidad" element={<UsuarioIdentityEdit />} /><Route path="usuarios/:id" element={<UsuarioDetail />} /><Route path="productos" element={<ProductosPage />} /><Route path="productos/nuevo" element={<ProductoForm />} /><Route path="productos/:id" element={<ProductoForm />} /><Route path="clientes" element={<ClientesPage />} /><Route path="clientes/nuevo" element={<ClienteForm />} /><Route path="clientes/:id" element={<ClienteForm />} /><Route path="perfil" element={<ProfilePage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>
}

export default App
