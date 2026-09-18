import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PROVINCE_LABELS } from '@/lib/provinces'
import { formatARS } from '@/lib/utils'
import { markPaymentApproved } from '../actions'

export const metadata = { title: 'Orden' }

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: true, shipment: true, addresses: true },
  })
  if (!order) notFound()

  const shipping = order.addresses.find((address) => address.kind === 'SHIPPING')
  const pendingTransfer = order.payments.find(
    (payment) => payment.provider === 'BANK_TRANSFER' && payment.status === 'PENDING',
  )

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.number}</h1>
      <p className="mt-1 text-sm text-muted">
        {order.email} · {order.phone} · {order.createdAt.toLocaleString('es-AR')}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-brand-100 bg-white p-5">
          <h2 className="font-semibold">Ítems</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.productName} · {item.variantName} × {item.quantity}
                </span>
                <span className="font-medium">{formatARS(item.lineTotal.toString())}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-brand-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatARS(order.subtotal.toString())}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Descuento</dt>
              <dd>−{formatARS(order.discountTotal.toString())}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{formatARS(order.shippingTotal.toString())}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{formatARS(order.total.toString())}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-brand-100 bg-white p-5">
          <h2 className="font-semibold">Entrega y pago</h2>
          {shipping && (
            <p className="mt-3 text-sm text-muted">
              {shipping.recipient}
              <br />
              {shipping.street} {shipping.number}
              {shipping.apartment ? `, ${shipping.apartment}` : ''}
              <br />
              {shipping.city}, {PROVINCE_LABELS[shipping.province]} ({shipping.postalCode})
            </p>
          )}
          {order.shipment && (
            <p className="mt-3 text-sm">
              Envío: {order.shipment.methodName} · {formatARS(order.shipment.cost.toString())}
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            {order.payments.map((payment) => (
              <li key={payment.id}>
                {payment.provider === 'BANK_TRANSFER'
                  ? 'Transferencia'
                  : payment.provider === 'CASH_ON_PICKUP'
                    ? 'Efectivo en showroom'
                    : 'Mercado Pago'}{' '}
                · {payment.status}
                {payment.paymentMethod ? ` · ${payment.paymentMethod}` : ''}
                {payment.installments && payment.installments > 1 ? ` · ${payment.installments} cuotas` : ''}
                {payment.externalId ? ` · ID ${payment.externalId}` : ''}
                {payment.feeAmount ? ` · comisión ${formatARS(payment.feeAmount.toString())}` : ''}
              </li>
            ))}
          </ul>
          {pendingTransfer && (
            <form
              className="mt-4"
              action={async () => {
                'use server'
                await markPaymentApproved(pendingTransfer.id)
              }}
            >
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                Marcar transferencia como cobrada
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
