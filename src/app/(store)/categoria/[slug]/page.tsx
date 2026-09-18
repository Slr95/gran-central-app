import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { listActiveProducts } from '@/lib/catalog'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return { title: 'Categoría' }
  return {
    title: category.name,
    description: category.description ?? `Muebles de ${category.name} en Gran Central.`,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: { children: { where: { isActive: true }, orderBy: { position: 'asc' } } },
  })

  if (!category) notFound()

  const categoryIds = [category.id, ...category.children.map((child) => child.id)]
  const products = await listActiveProducts({ categoryId: { in: categoryIds } })

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
      {category.description && <p className="mt-2 text-muted">{category.description}</p>}

      {products.length === 0 ? (
        <p className="mt-8 text-muted">No hay productos publicados en esta categoría.</p>
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
