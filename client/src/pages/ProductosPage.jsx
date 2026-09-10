import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

const emptyForm = {
  sku: '',
  nombre: '',
  descripcionCorta: '',
  descripcionLarga: '',
  precioNeto: '',
  stockActual: '',
  stockMinimo: '',
  stockBajo: '',
  stockAlto: '',
}

const productFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcionCorta', label: 'Descripción corta' },
  { key: 'descripcionLarga', label: 'Descripción larga', as: 'textarea', wide: true },
  { key: 'precioNeto', label: 'Precio neto', type: 'number', step: '0.01', min: '0.01' },
  { key: 'stockActual', label: 'Stock actual', type: 'number', min: '0' },
  { key: 'stockMinimo', label: 'Stock mínimo', type: 'number', min: '0' },
  { key: 'stockBajo', label: 'Umbral stock bajo', type: 'number', min: '0' },
  { key: 'stockAlto', label: 'Umbral stock alto', type: 'number', min: '0' },
]

const stockStatus = {
  bajo: { label: 'Stock bajo', className: 'border-[#d98b84] bg-[#fff3f1] text-[#9e3932]' },
  normal: { label: 'Stock normal', className: 'border-[#b9c9df] bg-[#f2f6ff] text-[#356ae6]' },
  alto: { label: 'Stock alto', className: 'border-[#91c7a7] bg-[#eef9f2] text-[#337553]' },
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function imageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return new URL(path, api.defaults.baseURL).toString()
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value))
}

function ProductInput({ field, form, onChange }) {
  const className = 'w-full rounded-md border border-[#d9e0e8] bg-[#fbfcfd] px-3.5 py-3 font-normal text-[#13202b] outline-none focus:border-[#356ae6] focus:ring-4 focus:ring-[#356ae61f]'
  const props = { name: field.key, value: form[field.key], onChange, required: true, className }
  return <label className={`space-y-2 text-sm font-semibold text-[#263446] ${field.wide ? 'sm:col-span-2' : ''}`}>{field.label}{field.as === 'textarea' ? <textarea {...props} rows="4" /> : <input {...props} type={field.type || 'text'} min={field.min} step={field.step} />}</label>
}

function StockBadge({ estadoStock }) {
  const status = stockStatus[estadoStock] || stockStatus.normal
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}><span className="mr-1.5" aria-hidden="true">●</span>{status.label}</span>
}

function ProductCard({ producto, onDelete, deleting }) {
  const navigate = useNavigate()

  return (
    <article className="flex flex-col border border-[#d9e0e8] bg-white transition hover:-translate-y-0.5 hover:border-[#9fb8ff] hover:shadow-[0_12px_28px_rgba(19,32,43,0.08)]">
      <div className="aspect-[16/9] overflow-hidden bg-[#eef2f6]">
        {producto.imagenUrl ? <img src={imageUrl(producto.imagenUrl)} alt={producto.nombre} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-sm text-[#647184]">Sin imagen</div>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#647184]">{producto.sku}</p><h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-[#13202b]">{producto.nombre}</h2></div><StockBadge estadoStock={producto.estadoStock} /></div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#647184]">{producto.descripcionCorta}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#e6ebf0] py-4"><div><p className="text-xs text-[#647184]">Precio venta</p><p className="mt-1 font-semibold text-[#13202b]">{formatPrice(producto.precioVenta)}</p></div><div><p className="text-xs text-[#647184]">Precio neto</p><p className="mt-1 font-semibold text-[#13202b]">{formatPrice(producto.precioNeto)}</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[#647184]">Stock actual</p><p className="mt-1 text-lg font-semibold text-[#13202b]">{producto.stockActual}</p></div><div><p className="text-xs text-[#647184]">Stock mínimo</p><p className="mt-1 text-lg font-semibold text-[#13202b]">{producto.stockMinimo}</p></div></div>
        <p className="mt-3 text-xs text-[#647184]">Bajo ≤ {producto.stockBajo} · Alto ≥ {producto.stockAlto}</p>
        <div className="mt-auto flex gap-3 pt-5"><button type="button" onClick={() => navigate(`/productos/${producto.id}`)} className="flex-1 rounded-md border border-[#356ae6] px-3 py-2.5 text-sm font-semibold text-[#356ae6] transition hover:bg-[#356ae6] hover:text-white focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3">Editar</button><button type="button" onClick={() => onDelete(producto)} disabled={deleting} className="rounded-md border border-[#d98b84] px-3 py-2.5 text-sm font-semibold text-[#9e3932] transition hover:bg-[#fff3f1] disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-[#d98b84] focus-visible:outline-offset-3">{deleting ? '…' : 'Eliminar'}</button></div>
      </div>
    </article>
  )
}

function ProductosList() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/productos')
      .then(({ data }) => { if (active) setProductos(data) })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar los productos. Intenta nuevamente.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleDelete(producto) {
    if (!window.confirm(`¿Eliminar a ${producto.nombre}? Esta acción no se puede deshacer.`)) return
    setDeletingId(producto.id)
    setError('')
    try {
      await api.delete(`/productos/${producto.id}`)
      setProductos((current) => current.filter((item) => item.id !== producto.id))
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'No pudimos eliminar el producto. Intenta nuevamente.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <section className="border border-[#d9e0e8] bg-white p-8 text-[#647184]" aria-live="polite">Cargando productos…</section>

  return <section><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[#356ae6]">Catálogo e inventario</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Productos</h2><p className="mt-2 text-sm text-[#647184]">{productos.length} {productos.length === 1 ? 'producto registrado' : 'productos registrados'}</p></div><button type="button" onClick={() => navigate('/productos/nuevo')} className="rounded-md border border-[#356ae6] bg-[#356ae6] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#2857c7] hover:bg-[#2857c7] focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3">+ Añadir producto</button></div>{error && <p className="mb-6 border-l-3 border-[#c94f45] bg-[#fff3f1] p-3 text-sm text-[#9e3932]" role="alert">{error}</p>}{productos.length === 0 && !error && <div className="border border-dashed border-[#aeb9c8] bg-white p-10 text-center"><p className="text-lg font-semibold">Aún no hay productos</p><p className="mt-2 text-sm text-[#647184]">Agrega el primero para comenzar a gestionar tu catálogo.</p></div>}{productos.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{productos.map((producto) => <ProductCard key={producto.id} producto={producto} onDelete={handleDelete} deleting={deletingId === producto.id} />)}</div>}</section>
}

export function ProductoForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()
  const isCreate = pathname.endsWith('/nuevo')
  const [form, setForm] = useState(emptyForm)
  const [existingImage, setExistingImage] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isCreate) return undefined
    let active = true
    api.get(`/productos/${id}`)
      .then(({ data }) => { if (active) { setForm({ ...emptyForm, ...data }); setExistingImage(data.imagenUrl || '') } })
      .catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este producto.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isCreate])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function handleImageChange(event) {
    setImage(event.target.files?.[0] || null)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = new FormData()
    productFields.forEach(({ key }) => payload.append(key, form[key]))
    if (image) payload.append('imagen', image)
    try {
      if (isCreate) await api.post('/productos', payload)
      else await api.put(`/productos/${id}`, payload)
      navigate('/productos', { replace: true })
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'No pudimos guardar el producto. Revisa los datos e intenta nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${form.nombre}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/productos/${id}`)
      navigate('/productos', { replace: true })
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'No pudimos eliminar el producto. Intenta nuevamente.'))
      setDeleting(false)
    }
  }

  if (loading) return <section className="border border-[#d9e0e8] bg-white p-8 text-[#647184]" aria-live="polite">Cargando datos del producto…</section>

  return <section className="mx-auto max-w-5xl"><button type="button" onClick={() => navigate('/productos')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#647184] hover:text-[#356ae6] focus-visible:outline-3 focus-visible:outline-[#9fb8ff] focus-visible:outline-offset-3"><span aria-hidden="true">←</span> Volver a productos</button><div className="mb-8 flex items-start gap-4"><div className="grid size-16 shrink-0 place-items-center border border-[#9fb8ff] bg-[#eaf0ff] font-serif text-2xl font-semibold text-[#356ae6]" aria-hidden="true">{(form.nombre || 'P').charAt(0).toUpperCase()}</div><div><p className="text-sm font-semibold text-[#356ae6]">{isCreate ? 'Nuevo producto' : 'Ficha de producto'}</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">{isCreate ? 'Añadir producto' : form.nombre || 'Editar producto'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#647184]">{isCreate ? 'Registra un producto para incorporarlo al catálogo.' : 'Actualiza la información comercial, la imagen y los umbrales de stock.'}</p></div></div><form onSubmit={handleSubmit} className="border border-[#d9e0e8] bg-white p-6 sm:p-8"><div className="mb-7 border-b border-[#d9e0e8] pb-5"><h3 className="text-lg font-semibold">Información del producto</h3><p className="mt-1 text-sm text-[#647184]">Todos los campos son obligatorios. El precio de venta se calcula con IVA.</p></div><div className="grid gap-5 sm:grid-cols-2">{productFields.slice(0, 4).map((field) => <ProductInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div><div className="mb-7 mt-9 border-b border-[#d9e0e8] pb-5"><h3 className="text-lg font-semibold">Precio y stock</h3><p className="mt-1 text-sm text-[#647184]">Los umbrales determinan la bandera de stock de la tarjeta.</p></div><div className="grid gap-5 sm:grid-cols-2">{productFields.slice(4).map((field) => <ProductInput key={field.key} field={field} form={form} onChange={handleChange} />)}<label className="space-y-2 text-sm font-semibold text-[#263446] sm:col-span-2">Imagen del producto{existingImage && !image && <img src={imageUrl(existingImage)} alt="Imagen actual" className="mb-2 h-32 w-48 rounded-md object-cover" />}<input type="file" name="imagen" accept="image/*" onChange={handleImageChange} required={isCreate} className="w-full rounded-md border border-dashed border-[#aeb9c8] bg-[#fbfcfd] px-3 py-3 text-sm font-normal text-[#647184] file:mr-3 file:rounded file:border-0 file:bg-[#eaf0ff] file:px-3 file:py-2 file:font-semibold file:text-[#356ae6]" />{!isCreate && <span className="block text-xs font-normal text-[#647184]">Déjalo vacío para conservar la imagen actual.</span>}</label></div>{error && <p className="mt-6 border-l-3 border-[#c94f45] bg-[#fff3f1] p-3 text-sm text-[#9e3932]" role="alert">{error}</p>}<div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#d9e0e8] pt-6 sm:flex-row sm:items-center sm:justify-between">{!isCreate ? <button type="button" onClick={handleDelete} disabled={deleting || saving} className="rounded-md border border-[#d98b84] px-4 py-3 text-sm font-semibold text-[#9e3932] disabled:opacity-60">{deleting ? 'Eliminando…' : 'Eliminar producto'}</button> : <span /> }<div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={() => navigate('/productos')} className="rounded-md border border-[#d9e0e8] px-4 py-3 text-sm font-semibold text-[#647184]">Cancelar</button><button type="submit" disabled={saving || deleting} className="rounded-md border border-[#356ae6] bg-[#356ae6] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando…' : isCreate ? 'Crear producto' : 'Guardar cambios'}</button></div></div></form></section>
}

export default function ProductosPage() {
  return <ProductosList />
}
