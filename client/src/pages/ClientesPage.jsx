import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

const emptyForm = {
  rutEmpresa: '',
  rubro: '',
  razonSocial: '',
  telefono: '',
  direccion: '',
  nombreContacto: '',
  emailContacto: '',
}

const clienteFields = [
  { key: 'rutEmpresa', label: 'RUT empresa' },
  { key: 'rubro', label: 'Rubro' },
  { key: 'razonSocial', label: 'Razón social' },
  { key: 'telefono', label: 'Teléfono', type: 'tel' },
  { key: 'direccion', label: 'Dirección', wide: true },
  { key: 'nombreContacto', label: 'Nombre de contacto' },
  { key: 'emailContacto', label: 'Correo de contacto', type: 'email' },
]

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function ClienteDato({ label, value }) {
  return <div className="border-t border-[#e6ebf0] pt-3"><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#647184]">{label}</dt><dd className="mt-1 break-words text-sm text-[#13202b]">{value}</dd></div>
}

function ClienteInput({ field, form, onChange }) {
  return <label className={`space-y-2 text-sm font-semibold text-[#263446] ${field.wide ? 'sm:col-span-2' : ''}`}>{field.label}<input name={field.key} type={field.type || 'text'} value={form[field.key]} onChange={onChange} required className="w-full rounded-md border border-[#d9e0e8] bg-[#fbfcfd] px-3.5 py-3 font-normal text-[#13202b] outline-none focus:border-[#356ae6] focus:ring-4 focus:ring-[#356ae61f]" /></label>
}

function ClienteCard({ cliente }) {
  const navigate = useNavigate()

  return (
    <article className="flex flex-col border border-[#d9e0e8] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#9fb8ff] hover:shadow-[0_12px_28px_rgba(19,32,43,0.08)]">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center border border-[#9fb8ff] bg-[#eaf0ff] font-serif text-lg font-semibold text-[#356ae6]" aria-hidden="true">{cliente.razonSocial.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><h2 className="text-xl font-semibold tracking-tight text-[#13202b]">{cliente.razonSocial}</h2><p className="mt-1 text-sm text-[#356ae6]">{cliente.rubro}</p></div>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {clienteFields.map((field) => <ClienteDato key={field.key} label={field.label} value={cliente[field.key]} />)}
      </dl>
      <button type="button" onClick={() => navigate(`/clientes/${cliente.id}`)} className="mt-6 w-full rounded-md border border-[#356ae6] px-4 py-3 text-sm font-semibold text-[#356ae6] transition hover:bg-[#356ae6] hover:text-white focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3">Editar cliente</button>
    </article>
  )
}


function ClientesList() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadClientes() {
      try {
        const { data } = await api.get('/clientes')
        if (active) setClientes(data)
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError, 'No pudimos cargar los clientes. Intenta nuevamente.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadClientes()
    return () => { active = false }
  }, [])

  if (loading) return <section className="border border-[#d9e0e8] bg-white p-8 text-[#647184]" aria-live="polite">Cargando clientes…</section>

  return (
    <section>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#356ae6]">Cartera comercial</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Clientes</h2>
          <p className="mt-2 text-sm text-[#647184]">{clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}</p>
        </div>
        <button type="button" onClick={() => navigate('/clientes/nuevo')} className="rounded-md border border-[#356ae6] bg-[#356ae6] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#2857c7] hover:bg-[#2857c7] focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3">
          + Añadir cliente
        </button>
      </div>

      {error && <p className="mb-6 border-l-3 border-[#c94f45] bg-[#fff3f1] p-3 text-sm text-[#9e3932]" role="alert">{error}</p>}
      {clientes.length === 0 && !error && <div className="border border-dashed border-[#aeb9c8] bg-white p-10 text-center"><p className="text-lg font-semibold">Aún no hay clientes</p><p className="mt-2 text-sm text-[#647184]">Agrega el primero para comenzar a gestionar tu cartera.</p></div>}
      {clientes.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{clientes.map((cliente) => <ClienteCard key={cliente.id} cliente={cliente} />)}</div>}
    </section>
  )
}

export function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()
  const isCreate = pathname.endsWith('/nuevo')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isCreate) return undefined
    let active = true
    api.get(`/clientes/${id}`)
      .then(({ data }) => { if (active) setForm({ ...emptyForm, ...data }) })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este cliente.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isCreate])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isCreate) await api.post('/clientes', form)
      else await api.put(`/clientes/${id}`, form)
      navigate('/clientes', { replace: true })
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'No pudimos guardar el cliente. Revisa los datos e intenta nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${form.razonSocial}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await api.delete(`/clientes/${id}`)
      navigate('/clientes', { replace: true })
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'No pudimos eliminar el cliente. Intenta nuevamente.'))
      setDeleting(false)
    }
  }

  if (loading) return <section className="border border-[#d9e0e8] bg-white p-8 text-[#647184]" aria-live="polite">Cargando datos del cliente…</section>

  return (
    <section className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate('/clientes')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#647184] hover:text-[#356ae6] focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3"><span aria-hidden="true">←</span> Volver a clientes</button>
      <div className="mb-8 flex items-start gap-4">
        <div className="grid size-16 shrink-0 place-items-center border border-[#9fb8ff] bg-[#eaf0ff] font-serif text-2xl font-semibold text-[#356ae6]" aria-hidden="true">{(form.razonSocial || 'C').charAt(0).toUpperCase()}</div>
        <div><p className="text-sm font-semibold text-[#356ae6]">{isCreate ? 'Nueva empresa' : 'Ficha de cliente'}</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">{isCreate ? 'Añadir cliente' : form.razonSocial || 'Editar cliente'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#647184]">{isCreate ? 'Registra una empresa para incorporarla a tu cartera comercial.' : 'Actualiza la información comercial y de contacto de esta empresa.'}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="border border-[#d9e0e8] bg-white p-6 sm:p-8">
        <div className="mb-7 border-b border-[#d9e0e8] pb-5"><h3 className="text-lg font-semibold">Datos de la empresa</h3><p className="mt-1 text-sm text-[#647184]">Todos los campos son obligatorios.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">{clienteFields.slice(0, 5).map((field) => <ClienteInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div>
        <div className="mb-7 mt-9 border-b border-[#d9e0e8] pb-5"><h3 className="text-lg font-semibold">Persona de contacto</h3><p className="mt-1 text-sm text-[#647184]">El contacto principal para comunicaciones comerciales.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">{clienteFields.slice(5).map((field) => <ClienteInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div>
        {error && <p className="mt-6 border-l-3 border-[#c94f45] bg-[#fff3f1] p-3 text-sm text-[#9e3932]" role="alert">{error}</p>}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#d9e0e8] pt-6 sm:flex-row sm:items-center sm:justify-between">
          {!isCreate ? <button type="button" onClick={handleDelete} disabled={deleting || saving} className="rounded-md border border-[#d98b84] px-4 py-3 text-sm font-semibold text-[#9e3932] disabled:opacity-60">{deleting ? 'Eliminando…' : 'Eliminar cliente'}</button> : <span />}
          <div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={() => navigate('/clientes')} className="rounded-md border border-[#d9e0e8] px-4 py-3 text-sm font-semibold text-[#647184]">Cancelar</button><button type="submit" disabled={saving || deleting} className="rounded-md border border-[#356ae6] bg-[#356ae6] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando…' : isCreate ? 'Crear cliente' : 'Guardar cambios'}</button></div>
        </div>
      </form>
    </section>
  )
}

export default function ClientesPage() {
  return <ClientesList />
}
