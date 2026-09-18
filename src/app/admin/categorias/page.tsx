import { prisma } from '@/lib/prisma'
import { toggleCategory } from './actions'
import { CategoryCreateForm } from './category-create-form'

export const metadata = { title: 'Categorías' }

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { position: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
      <p className="mt-1 text-sm text-muted">Las categorías raíz aparecen en el menú de la tienda.</p>
      <CategoryCreateForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Productos</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 text-muted">{category.slug}</td>
                <td className="px-4 py-3">{category._count.products}</td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      'use server'
                      await toggleCategory(category.id, !category.isActive)
                    }}
                  >
                    <button type="submit" className="text-sm text-brand-600 hover:underline">
                      {category.isActive ? 'Ocultar' : 'Publicar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
