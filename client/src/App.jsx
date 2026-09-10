import { BrowserRouter, Navigate, Outlet, Route, Routes, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
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
  const currentSection = location.pathname.split('/')[1] || 'dashboard'
  const section = sections[currentSection] || sections.dashboard

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#13202b]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#293b4e] bg-[#13202b] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2"><span className="grid size-10 place-items-center border border-[#9fb8ff] text-lg font-bold text-[#9fb8ff]">V</span><div><p className="font-semibold tracking-tight">VentasFix</p><p className="text-xs text-[#9aaabd]">Backoffice</p></div></div>
        <nav className="mt-12 space-y-2" aria-label="Navegación principal">
          {Object.entries(sections).map(([key, item]) => <NavLink key={key} to={`/${key}`} className={({ isActive }) => `flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-medium transition ${isActive ? 'border-[#9fb8ff] bg-[#20344b] text-white' : 'border-transparent text-[#aab8c9] hover:border-[#6e8edc] hover:bg-white/5 hover:text-white'}`}><span className="size-1.5 rounded-full bg-current opacity-70" />{item.label}</NavLink>)}
        </nav>
        <div className="mt-auto border-t border-[#293b4e] pt-4"><p className="truncate text-sm font-semibold">{user?.nombre}</p><p className="mt-1 truncate text-xs text-[#9aaabd]">{user?.email}</p><button onClick={handleLogout} className="mt-4 text-xs font-semibold text-[#9fb8ff] hover:text-white">Cerrar sesión</button></div>
      </aside>
      <main className="lg:pl-64"><header className="flex items-center justify-between border-b border-[#d9e0e8] bg-[#f6f7f4] px-5 py-5 lg:px-10"><div><p className="text-sm text-[#647184]">VentasFix / {section.label}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{section.title}</h1></div><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-semibold">{user?.nombre}</span><span className="block text-xs text-[#647184]">Administrador</span></span><span className="grid size-10 place-items-center rounded-full bg-[#356ae6] text-sm font-bold text-white">{user?.nombre?.charAt(0).toUpperCase()}</span></div></header><div className="p-5 lg:p-10"><Outlet /></div></main>
    </div>
  )
}

function WorkspacePage() {
  const location = useLocation()
  const section = sections[location.pathname.split('/')[1]] || sections.dashboard
  return <section className="rounded-xl border border-[#d9e0e8] bg-white p-7 lg:p-10"><div className="flex size-11 items-center justify-center border border-[#9fb8ff] text-sm font-bold text-[#356ae6]">{section.label.slice(0, 2).toUpperCase()}</div><h2 className="mt-7 text-3xl font-semibold tracking-tight">{section.title}</h2><p className="mt-3 max-w-lg text-[#647184]">{section.description} Esta sección estará disponible en la siguiente fase.</p></section>
}

function App() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route index element={<Navigate to="/dashboard" replace />} /><Route path="dashboard" element={<WorkspacePage />} /><Route path="usuarios" element={<WorkspacePage />} /><Route path="productos" element={<WorkspacePage />} /><Route path="clientes" element={<WorkspacePage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>
}

export default App
