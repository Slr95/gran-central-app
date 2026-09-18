import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatARS } from '@/lib/utils'
import { ProductRowActions } from './product-row-actions'

export const metadata = { title: 'Productos' }

const statusLabels = {
  DRAFT: { label: 'Borrador', className: 'bg-amber-100 text-amber-800' },
  ACTIVE: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
  ARCHIVED: { label: 'Archivado', className: 'bg-neutral-200 text-neutral-700' },
} as const

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>
}) {
  const { q, estado } = await searchParams

  const products = await prisma.product.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(estado && estado in statusLabels
        ? { status: estado as keyof typeof statusLabels }
        : // Por defecto los archivados no se muestran: son los que el admin "borró".
          { status: { not: 'ARCHIVED' as const } }),
    },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { position: 'asc' }, take: 1 },
      variants: { select: { price: true, stock: true, isActive: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted">{products.length} producto(s)</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="size-4" />
          Nuevo producto
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nombre…"
          className="w-64 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select
          name="estado"
          defaultValue={estado ?? ''}
          className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Activos y borradores</option>
          <option value="ACTIVE">Publicados</option>
          <option value="DRAFT">Borradores</option>
          <option value="ARCHIVED">Archivados</option>
        </select>
        <button type="submit" className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium hover:bg-brand-50">
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No hay productos que coincidan con el filtro.
                </td>
              </tr>
            )}

            {products.map((product) => {
              const prices = product.variants.map((variant) => Number(variant.price))
              const minPrice = prices.length ? Math.min(...prices) : 0
              const maxPrice = prices.length ? Math.max(...prices) : 0
              const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)
              const status = statusLabels[product.status]

              return (
                <tr key={product.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-brand-50">
                        {product.images[0] && (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="font-medium hover:text-brand-600"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted">
                          {product.variants.length} variante(s)
                          {product.isFeatured && ' · Destacado'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{product.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {minPrice === maxPrice
                      ? formatARS(minPrice)
                      : `${formatARS(minPrice)} – ${formatARS(maxPrice)}`}
                  </td>
                  <td className={`px-4 py-3 ${totalStock === 0 ? 'text-red-600' : ''}`}>{totalStock}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProductRowActions
                      id={product.id}
                      status={product.status}
                      isFeatured={product.isFeatured}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
