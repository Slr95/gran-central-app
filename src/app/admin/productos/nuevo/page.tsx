import Link from 'next/link'
import { emptyVariant, ProductForm } from '@/components/admin/product-form'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-brand-600">
        ← Volver a productos
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nuevo producto</h1>

      <div className="mt-8">
        <ProductForm
          categories={categories}
          initialValues={{
            name: '',
            slug: '',
            description: '',
            shortDescription: '',
            categoryId: '',
            brand: '',
            status: 'DRAFT',
            isFeatured: false,
            metaTitle: '',
            metaDescription: '',
            images: [],
            variants: [{ ...emptyVariant }],
          }}
        />
      </div>
    </div>
  )
}
