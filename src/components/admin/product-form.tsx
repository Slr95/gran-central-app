'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveProduct } from '@/app/admin/productos/actions'
import { ImageUploader } from '@/components/admin/image-uploader'
import { slugify } from '@/lib/utils'
import type { ProductImageInput } from '@/lib/validations/product'

/** Los inputs del DOM siempre dan string; la conversión la hace zod en el server. */
type VariantDraft = {
  id?: string
  sku: string
  name: string
  price: string
  compareAtPrice: string
  stock: string
  allowBackorder: boolean
  isActive: boolean
  weightKg: string
  lengthCm: string
  widthCm: string
  heightCm: string
  isOversized: boolean
  requiresAssembly: boolean
}

export type ProductFormValues = {
  id?: string
  name: string
  slug: string
  description: string
  shortDescription: string
  categoryId: string
  brand: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  isFeatured: boolean
  metaTitle: string
  metaDescription: string
  images: ProductImageInput[]
  variants: VariantDraft[]
}

export const emptyVariant: VariantDraft = {
  sku: '',
  name: 'Única',
  price: '',
  compareAtPrice: '',
  stock: '0',
  allowBackorder: false,
  isActive: true,
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  isOversized: false,
  requiresAssembly: false,
}

const inputClass =
  'mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500'

export function ProductForm({
  initialValues,
  categories,
}: {
  initialValues: ProductFormValues
  categories: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState(initialValues)
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.id))
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setVariant(index: number, patch: Partial<VariantDraft>) {
    setValues((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    startTransition(async () => {
      const result = await saveProduct({
        ...values,
        description: values.description || null,
        shortDescription: values.shortDescription || null,
        categoryId: values.categoryId || null,
        brand: values.brand || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
      })

      if (result.ok) {
        router.push('/admin/productos')
        router.refresh()
        return
      }

      setError(result.error)
      setFieldErrors(result.fieldErrors ?? {})
    })
  }

  function errorFor(path: string) {
    return fieldErrors[path]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      <section className="rounded-xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold">Datos básicos</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              value={values.name}
              onChange={(event) => {
                const name = event.target.value
                setValues((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : slugify(name),
                }))
              }}
              className={inputClass}
            />
            {errorFor('name') && <p className="mt-1 text-xs text-red-700">{errorFor('name')}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug (URL)
            </label>
            <input
              id="slug"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true)
                set('slug', event.target.value)
              }}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted">/producto/{values.slug || '…'}</p>
            {errorFor('slug') && <p className="mt-1 text-xs text-red-700">{errorFor('slug')}</p>}
          </div>

          <div>
            <label htmlFor="categoryId" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="categoryId"
              value={values.categoryId}
              onChange={(event) => set('categoryId', event.target.value)}
              className={inputClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brand" className="text-sm font-medium">
              Marca
            </label>
            <input
              id="brand"
              value={values.brand}
              onChange={(event) => set('brand', event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="shortDescription" className="text-sm font-medium">
              Descripción corta
            </label>
            <input
              id="shortDescription"
              value={values.shortDescription}
              onChange={(event) => set('shortDescription', event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="description"
              rows={5}
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="status" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="status"
              value={values.status}
              onChange={(event) => set('status', event.target.value as ProductFormValues['status'])}
              className={inputClass}
            >
              <option value="DRAFT">Borrador (no se ve en la tienda)</option>
              <option value="ACTIVE">Publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>

          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(event) => set('isFeatured', event.target.checked)}
              className="size-4 rounded border-brand-300"
            />
            Mostrar en destacados
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold">Imágenes</h2>
        <div className="mt-4">
          <ImageUploader images={values.images} onChange={(images) => set('images', images)} />
        </div>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Variantes y precios</h2>
            <p className="mt-1 text-sm text-muted">
              Una variante por combinación de color y medida. Si el producto es único, dejá una sola.
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('variants', [...values.variants, { ...emptyVariant }])}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium hover:bg-brand-50"
          >
            Agregar variante
          </button>
        </div>

        {errorFor('variants') && <p className="mt-2 text-sm text-red-700">{errorFor('variants')}</p>}

        <div className="mt-4 space-y-4">
          {values.variants.map((variant, index) => (
            <div key={variant.id ?? index} className="rounded-lg border border-brand-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Nombre de la variante</label>
                    <input
                      value={variant.name}
                      onChange={(event) => setVariant(index, { name: event.target.value })}
                      placeholder="Chenille gris - 3 cuerpos"
                      className={inputClass}
                    />
                    {errorFor(`variants.${index}.name`) && (
                      <p className="mt-1 text-xs text-red-700">{errorFor(`variants.${index}.name`)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">SKU</label>
                    <input
                      value={variant.sku}
                      onChange={(event) => setVariant(index, { sku: event.target.value })}
                      className={inputClass}
                    />
                    {errorFor(`variants.${index}.sku`) && (
                      <p className="mt-1 text-xs text-red-700">{errorFor(`variants.${index}.sku`)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Precio de venta</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.price}
                      onChange={(event) => setVariant(index, { price: event.target.value })}
                      className={inputClass}
                    />
                    {errorFor(`variants.${index}.price`) && (
                      <p className="mt-1 text-xs text-red-700">{errorFor(`variants.${index}.price`)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Precio de lista (tachado)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.compareAtPrice}
                      onChange={(event) => setVariant(index, { compareAtPrice: event.target.value })}
                      placeholder="Vacío = sin oferta"
                      className={inputClass}
                    />
                    {errorFor(`variants.${index}.compareAtPrice`) && (
                      <p className="mt-1 text-xs text-red-700">
                        {errorFor(`variants.${index}.compareAtPrice`)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(event) => setVariant(index, { stock: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                {values.variants.length > 1 && (
                  <button
                    type="button"
                    title="Quitar variante"
                    onClick={() =>
                      set(
                        'variants',
                        values.variants.filter((_, i) => i !== index),
                      )
                    }
                    className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-700">
                  Logística y medidas
                </summary>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-sm font-medium">Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.weightKg}
                      onChange={(event) => setVariant(index, { weightKg: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Largo (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.lengthCm}
                      onChange={(event) => setVariant(index, { lengthCm: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ancho (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.widthCm}
                      onChange={(event) => setVariant(index, { widthCm: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alto (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.heightCm}
                      onChange={(event) => setVariant(index, { heightCm: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-5 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.isOversized}
                      onChange={(event) => setVariant(index, { isOversized: event.target.checked })}
                      className="size-4 rounded border-brand-300"
                    />
                    Bulto grande (no entra en correo)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.requiresAssembly}
                      onChange={(event) => setVariant(index, { requiresAssembly: event.target.checked })}
                      className="size-4 rounded border-brand-300"
                    />
                    Requiere armado
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.allowBackorder}
                      onChange={(event) => setVariant(index, { allowBackorder: event.target.checked })}
                      className="size-4 rounded border-brand-300"
                    />
                    Se vende sin stock (a pedido)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(event) => setVariant(index, { isActive: event.target.checked })}
                      className="size-4 rounded border-brand-300"
                    />
                    Activa
                  </label>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold">SEO</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que se ve en Google y en la preview al compartir por WhatsApp. Si se deja vacío se usa el
          nombre y la descripción del producto.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="metaTitle" className="text-sm font-medium">
              Título
            </label>
            <input
              id="metaTitle"
              value={values.metaTitle}
              onChange={(event) => set('metaTitle', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="metaDescription" className="text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="metaDescription"
              rows={2}
              value={values.metaDescription}
              onChange={(event) => set('metaDescription', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar producto
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="rounded-lg border border-brand-300 px-5 py-2.5 font-medium hover:bg-brand-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
