import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Órdenes' }

const paymentLabel = {
  PENDING: 'Pago pendiente',
  IN_PROCESS: 'En proceso',
  APPROVED: 'Pagada',
  REJECTED: 'Rechazada',
  REFUNDED: 'Reembolsada',
  CHARGED_BACK: 'Contracargo',
  CANCELLED: 'Cancelada',
} as const

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} pedido(s) más recientes</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Todavía no hay ventas.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/ordenes/${order.id}`} className="font-medium hover:text-brand-600">
                    #{order.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.email}</td>
                <td className="px-4 py-3">{formatARS(order.total.toString())}</td>
                <td className="px-4 py-3 text-muted">{paymentLabel[order.paymentStatus]}</td>
                <td className="px-4 py-3 text-muted">{order.createdAt.toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
