import { prisma } from '@/lib/prisma'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Resumen' }

export default async function AdminDashboardPage() {
  const [activeProducts, lowStock, pendingOrders, revenue] = await Promise.all([
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.productVariant.count({ where: { isActive: true, allowBackorder: false, stock: { lte: 3 } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'APPROVED' },
      _sum: { total: true },
    }),
  ])

  const cards = [
    { label: 'Productos publicados', value: String(activeProducts) },
    { label: 'Variantes con stock bajo', value: String(lowStock) },
    { label: 'Órdenes pendientes', value: String(pendingOrders) },
    { label: 'Facturado (pagos aprobados)', value: formatARS(revenue._sum.total?.toString() ?? 0) },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
      <p className="mt-1 text-sm text-muted">Estado general de la tienda.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-brand-100 bg-white p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
