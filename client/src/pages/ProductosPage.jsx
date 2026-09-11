// Páginas del módulo de productos: listado con tarjetas y formulario
// de creación/edición con soporte para subir imagen
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../lib/api'
import { BackLink, ErrorMessage, FieldInput, FormIntro, ListPage, LoadingSection, useForm } from '../components/ui'

const emptyForm = { sku: '', nombre: '', descripcionCorta: '', descripcionLarga: '', precioNeto: '', stockActual: '', stockMinimo: '', stockBajo: '', stockAlto: '' }
// Campos del formulario de producto (texto, número o textarea según configuración)
const productFields = [
  { key: 'sku', label: 'SKU' }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcionCorta', label: 'Descripción corta' },
  { key: 'descripcionLarga', label: 'Descripción larga', as: 'textarea', wide: true }, { key: 'precioNeto', label: 'Precio neto', type: 'number', step: '0.01', min: '0.01' },
  { key: 'stockActual', label: 'Stock actual', type: 'number', min: '0' }, { key: 'stockMinimo', label: 'Stock mínimo', type: 'number', min: '0' },
  { key: 'stockBajo', label: 'Umbral stock bajo', type: 'number', min: '0' }, { key: 'stockAlto', label: 'Umbral stock alto', type: 'number', min: '0' },
]
// Texto y estilo CSS de cada estado de stock que puede devolver la API
const stockStatus = { bajo: { label: 'Stock bajo', className: 'stock-badge-low' }, normal: { label: 'Stock normal', className: '' }, alto: { label: 'Stock alto', className: 'stock-badge-high' } }

// Resuelve la URL de la imagen: si es una ruta relativa, la completa con la base de la API
function imageUrl(path) { if (!path) return ''; if (path.startsWith('http')) return path; return new URL(path, api.defaults.baseURL).toString() }
// Formatea un número como precio en pesos chilenos
function formatPrice(value) { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value)) }

// Etiqueta visual del estado de stock (bajo / normal / alto)
function StockBadge({ estadoStock }) { const status = stockStatus[estadoStock] || stockStatus.normal; return <span className={`stock-badge ${status.className}`}><span aria-hidden="true">●</span>{status.label}</span> }

// Tarjeta del listado: imagen, datos comerciales, stock y acciones de editar/eliminar
function ProductCard({ producto, onDelete, deleting }) {
  const navigate = useNavigate()
  return <article className="entity-card p-0"><div className="product-image">{producto.imagenUrl ? <img src={imageUrl(producto.imagenUrl)} alt={producto.nombre} /> : <div className="product-image-empty">Sin imagen</div>}</div><div className="flex flex-1 flex-col p-5"><div className="entity-card-heading"><div className="min-w-0"><p className="data-label">{producto.sku}</p><h2 className="entity-title mt-1 truncate">{producto.nombre}</h2></div><StockBadge estadoStock={producto.estadoStock} /></div><p className="entity-description line-clamp-2">{producto.descripcionCorta}</p><div className="metric-grid"><div><p className="metric-label">Precio venta</p><p className="metric-value">{formatPrice(producto.precioVenta)}</p></div><div><p className="metric-label">Precio neto</p><p className="metric-value">{formatPrice(producto.precioNeto)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="metric-label">Stock actual</p><p className="stock-number">{producto.stockActual}</p></div><div><p className="metric-label">Stock mínimo</p><p className="stock-number">{producto.stockMinimo}</p></div></div><p className="stock-note">Bajo ≤ {producto.stockBajo} · Alto ≥ {producto.stockAlto}</p><div className="card-actions"><button type="button" onClick={() => navigate(`/productos/${producto.id}`)} className="outline-button focus-ring">Editar</button><button type="button" onClick={() => onDelete(producto)} disabled={deleting} className="danger-button focus-ring">{deleting ? '…' : 'Eliminar'}</button></div></div></article>
}

// Formulario de creación y edición de producto (rutas /productos/nuevo y /productos/:id).
// Usa FormData porque puede incluir el archivo de imagen
export function ProductoForm() {
  // La misma pantalla sirve para crear y editar: se distingue por la URL (/nuevo)
  const navigate = useNavigate(); const { id } = useParams(); const { pathname } = useLocation(); const isCreate = pathname.endsWith('/nuevo')
  const { form, setForm, error, setError, handleChange } = useForm(emptyForm)
  const [existingImage, setExistingImage] = useState(''); const [image, setImage] = useState(null); const [loading, setLoading] = useState(!isCreate); const [saving, setSaving] = useState(false); const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isCreate) return undefined
    let active = true
    api.get(`/productos/${id}`).then(({ data }) => { if (active) { setForm({ ...emptyForm, ...data }); setExistingImage(data.imagenUrl || '') } }).catch((loadError) => { if (active) setError(getErrorMessage(loadError, 'No pudimos cargar este producto.')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isCreate, setForm, setError])

  function handleImageChange(event) { setImage(event.target.files?.[0] || null); setError('') }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError('')
    // Se envía como multipart/form-data para poder adjuntar la imagen si se eligió una
    const payload = new FormData(); productFields.forEach(({ key }) => payload.append(key, form[key])); if (image) payload.append('imagen', image)
    try { if (isCreate) await api.post('/productos', payload); else await api.put(`/productos/${id}`, payload); navigate('/productos', { replace: true }) } catch (saveError) { setError(getErrorMessage(saveError, 'No pudimos guardar el producto. Revisa los datos e intenta nuevamente.')) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${form.nombre}? Esta acción no se puede deshacer.`)) return
    setDeleting(true); setError('')
    try { await api.delete(`/productos/${id}`); navigate('/productos', { replace: true }) } catch (deleteError) { setError(getErrorMessage(deleteError, 'No pudimos eliminar el producto. Intenta nuevamente.')); setDeleting(false) }
  }

  if (loading) return <LoadingSection>Cargando datos del producto…</LoadingSection>
  return <section className="form-page"><BackLink to="/productos">Volver a productos</BackLink><FormIntro mark={(form.nombre || 'P').charAt(0).toUpperCase()} kicker={isCreate ? 'Nuevo producto' : 'Ficha de producto'} title={isCreate ? 'Añadir producto' : form.nombre || 'Editar producto'} copy={isCreate ? 'Registra un producto para incorporarlo al catálogo.' : 'Actualiza la información comercial, la imagen y los umbrales de stock.'} /><form onSubmit={handleSubmit} className="form-surface"><div className="form-section"><h3>Información del producto</h3><p>Todos los campos son obligatorios. El precio de venta se calcula con IVA.</p></div><div className="form-grid">{productFields.slice(0, 4).map((field) => <FieldInput key={field.key} field={field} form={form} onChange={handleChange} />)}</div><div className="form-section mt-8"><h3>Precio y stock</h3><p>Los umbrales determinan la bandera de stock de la tarjeta.</p></div><div className="form-grid">{productFields.slice(4).map((field) => <FieldInput key={field.key} field={field} form={form} onChange={handleChange} />)}<label className="form-label form-grid-wide">Imagen del producto{existingImage && !image && <img src={imageUrl(existingImage)} alt="Imagen actual" className="image-preview" />}<input type="file" name="imagen" accept="image/*" onChange={handleImageChange} required={isCreate} className="form-input" />{!isCreate && <span className="text-xs font-normal text-[var(--muted)]">Déjalo vacío para conservar la imagen actual.</span>}</label></div><ErrorMessage error={error} className="mt-6" /><div className="form-actions">{!isCreate ? <button type="button" onClick={handleDelete} disabled={deleting || saving} className="danger-button focus-ring">{deleting ? 'Eliminando…' : 'Eliminar producto'}</button> : <span /> }<div className="form-actions-right"><button type="button" onClick={() => navigate('/productos')} className="outline-button focus-ring">Cancelar</button><button type="submit" disabled={saving || deleting} className="action-button focus-ring">{saving ? 'Guardando…' : isCreate ? 'Crear producto' : 'Guardar cambios'}</button></div></div></form></section>
}

// Listado de productos con eliminación directa desde la tarjeta
export default function ProductosPage() {
  return <ListPage endpoint="/productos" singular="producto" plural="productos" title="Productos" kicker="Catálogo e inventario" emptyText="Agrega el primero para comenzar a gestionar tu catálogo." deleteConfirm={(producto) => `¿Eliminar a ${producto.nombre}? Esta acción no se puede deshacer.`} renderCard={(producto, { onDelete, deleting }) => <ProductCard producto={producto} onDelete={onDelete} deleting={deleting} />} />
}
