import Image from 'next/image'
import Link from 'next/link'
import { isOnSale } from '@/lib/catalog'
import { prisma } from '@/lib/prisma'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Ofertas' }

export default async function AdminOffersPage() {
  const products = await prisma.product.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      variants: { some: { isActive: true, compareAtPrice: { not: null } } },
    },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      variants: { where: { isActive: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const onSale = products.filter((product) =>
    product.variants.some((variant) => isOnSale(variant.price, variant.compareAtPrice)),
  )

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Ofertas</h1>
      <p className="mt-1 text-sm text-muted">
        Una oferta puntual se arma con el precio tachado de la variante. Las campañas por categoría
        (`Promotion`) se conectan después.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Precio actual</th>
              <th className="px-4 py-3 font-medium">Antes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {onSale.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No hay productos con precio tachado. Editá una variante y cargá “precio anterior”.
                </td>
              </tr>
            )}
            {onSale.map((product) => {
              const variant = product.variants.find((item) => isOnSale(item.price, item.compareAtPrice))!
              return (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 overflow-hidden rounded-md bg-brand-50">
                        {product.images[0] && (
                          <Image src={product.images[0].url} alt="" fill sizes="44px" className="object-cover" />
                        )}
                      </div>
                      {product.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatARS(variant.price.toString())}</td>
                  <td className="px-4 py-3 text-muted line-through">
                    {formatARS(variant.compareAtPrice!.toString())}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/productos/${product.id}`} className="text-brand-600 hover:underline">
                      Editar
                    </Link>
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
