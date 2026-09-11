// Guardia de rutas privadas: envuelve las páginas que requieren sesión iniciada
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  // Sin sesión: redirige al login guardando la ruta original en `state.from`
  // para volver a ella después de ingresar
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Con sesión: renderiza la ruta hija que corresponda
  return <Outlet />
}

export default ProtectedRoute
