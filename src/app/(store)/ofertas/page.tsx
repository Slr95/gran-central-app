import { ProductCard } from '@/components/product-card'
import { listSaleProducts } from '@/lib/catalog'

export const metadata = {
  title: 'Ofertas',
  description: 'Colchones, sommiers y almohadas en oferta con precio tachado.',
}

export default async function OffersPage() {
  const products = await listSaleProducts()

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Ofertas</h1>
      <p className="mt-2 text-muted">Productos con precio anterior tachado.</p>

      {products.length === 0 ? (
        <p className="mt-8 text-muted">No hay ofertas activas en este momento.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  )
}
