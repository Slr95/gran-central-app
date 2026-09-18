import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { listActiveProducts } from '@/lib/catalog'
import { prisma } from '@/lib/prisma'

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { position: 'asc' },
    }),
    listActiveProducts({}, 8),
  ])

  return (
    <>
      <section className="rounded-2xl bg-brand-700 px-8 py-16 text-white">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Muebles que duran, precios que cierran
        </h1>
        <p className="mt-4 max-w-xl text-brand-100">
          Envíos a todo el país, cuotas con tarjeta y descuento pagando por transferencia.
        </p>
        <Link
          href="/ofertas"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 transition-transform hover:scale-105"
        >
          Ver ofertas
        </Link>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Categorías</h2>
        {categories.length === 0 ? (
          <p className="mt-4 text-muted">Todavía no hay categorías publicadas.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="rounded-xl border border-brand-100 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="font-semibold">{category.name}</span>
                {category.description && (
                  <p className="mt-1 text-sm text-muted">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Destacados</h2>
        {products.length === 0 ? (
          <p className="mt-4 text-muted">El catálogo todavía está vacío.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
