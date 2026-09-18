import Link from 'next/link'
import { signOut } from '@/auth'
import { requireUser } from '@/lib/guards'
import { prisma } from '@/lib/prisma'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Mi cuenta' }

const statusLabel = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
} as const

export default async function AccountPage() {
  const user = await requireUser()
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { payments: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
      <p className="mt-2 text-muted">
        {user.name} · {user.email}
      </p>

      <h2 className="mt-10 text-xl font-semibold">Pedidos</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted">Todavía no hiciste ningún pedido.</p>
      ) : (
        <ul className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100 bg-white">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">Pedido #{order.number}</p>
                <p className="text-muted">{order.createdAt.toLocaleDateString('es-AR')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatARS(order.total.toString())}</p>
                <p className="text-muted">{statusLabel[order.status]}</p>
                {order.payments.some(
                  (payment) =>
                    payment.provider === 'MERCADO_PAGO' &&
                    (payment.status === 'PENDING' ||
                      payment.status === 'IN_PROCESS' ||
                      payment.status === 'REJECTED'),
                ) && (
                  <Link
                    href={`/checkout/gracias?orden=${order.number}`}
                    className="mt-1 inline-block text-brand-600 hover:underline"
                  >
                    Pagar con Mercado Pago
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-8"
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}
      >
        <button type="submit" className="text-sm text-brand-600 hover:underline">
          Cerrar sesión
        </button>
      </form>

      {user.role === 'ADMIN' && (
        <p className="mt-4 text-sm">
          <Link href="/admin" className="text-brand-600 hover:underline">
            Ir al panel de administración
          </Link>
        </p>
      )}
    </>
  )
}
