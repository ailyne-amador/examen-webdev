import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'

const metrics = [
  { key: 'usuarios', label: 'Usuarios', description: 'Personas con acceso al backoffice', path: '/usuarios' },
  { key: 'productos', label: 'Productos', description: 'Ítems registrados en el catálogo', path: '/productos' },
  { key: 'clientes', label: 'Clientes', description: 'Empresas de tu cartera comercial', path: '/clientes' },
]

const loadErrorMessage = 'No pudimos cargar el resumen. Intenta nuevamente.'

function MetricCard({ metric, value }) {
  return (
    <Link to={metric.path} className="dashboard-metric focus-ring">
      <span className="dashboard-metric-label">{metric.label}</span>
      <strong className="dashboard-metric-value">{value}</strong>
      <span className="dashboard-metric-description">{metric.description}</span>
      <span className="dashboard-metric-link">Ver {metric.label.toLowerCase()}</span>
    </Link>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/dashboard')
      .then(({ data }) => { if (active) setSummary(data) })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, loadErrorMessage)) })
    return () => { active = false }
  }, [])

  if (!summary && !error) return <section className="loading-surface" aria-live="polite">Cargando resumen…</section>

  return (
    <section className="dashboard-page">
      <div className="dashboard-intro">
        <div>
          <p className="page-kicker">Panorama general</p>
          <h2 className="page-title">Todo en un vistazo</h2>
          <p className="dashboard-intro-copy">Consulta el estado actual de tus registros y entra directamente a lo que necesitas gestionar.</p>
        </div>
        <div className="dashboard-intro-mark" aria-hidden="true">VF</div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {summary && <div className="dashboard-metrics">{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} value={summary[metric.key]} />)}</div>}

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel">
          <p className="page-kicker">Accesos rápidos</p>
          <h3>Gestiona lo importante</h3>
          <div className="dashboard-actions">
            <Link to="/productos/nuevo" className="action-button focus-ring">Añadir producto</Link>
            <Link to="/clientes/nuevo" className="outline-button focus-ring">Añadir cliente</Link>
            <Link to="/usuarios/nuevo" className="outline-button focus-ring">Añadir usuario</Link>
          </div>
        </section>
        <aside className="dashboard-note">
          <span className="dashboard-note-mark" aria-hidden="true">i</span>
          <h3>Un espacio para decidir</h3>
          <p>Usa los conteos como punto de partida. Cada tarjeta te lleva al listado correspondiente para revisar o actualizar sus registros.</p>
        </aside>
      </div>
    </section>
  )
}
