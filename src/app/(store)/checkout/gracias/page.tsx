import Link from 'next/link'
import { notFound } from 'next/navigation'
import { resumeMercadoPagoPayment } from '../actions'
import { requireUser } from '@/lib/guards'
import { applyMercadoPagoPayment } from '@/lib/payments'
import { prisma } from '@/lib/prisma'
import { getStoreSettings } from '@/lib/settings'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Pedido confirmado' }

const paymentCopy: Record<string, string> = {
  APPROVED: 'Pago acreditado.',
  PENDING: 'Estamos esperando el pago.',
  IN_PROCESS: 'Mercado Pago está procesando el pago.',
  REJECTED: 'El pago fue rechazado.',
  CANCELLED: 'El pago se canceló.',
  REFUNDED: 'El pago fue reembolsado.',
  CHARGED_BACK: 'Hubo un contracargo.',
}

export default async function CheckoutThanksPage({
  searchParams,
}: {
  searchParams: Promise<{
    orden?: string
    mp?: string
    payment_id?: string
    collection_id?: string
    status?: string
  }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const number = Number(params.orden)
  if (!Number.isInteger(number)) notFound()

  let order = await prisma.order.findFirst({
    where: { number, userId: user.id },
    include: { payments: true },
  })
  if (!order) notFound()

  const mpPaymentId = params.payment_id ?? params.collection_id
  if (mpPaymentId) {
    try {
      await applyMercadoPagoPayment(mpPaymentId, order.id)
      order = await prisma.order.findFirstOrThrow({
        where: { id: order.id },
        include: { payments: true },
      })
    } catch (error) {
      console.error('sync mp payment on return', error)
    }
  }

  const settings = await getStoreSettings()
  const transfer = order.payments.find((payment) => payment.provider === 'BANK_TRANSFER')
  const mp = order.payments.find((payment) => payment.provider === 'MERCADO_PAGO')
  const mpPending = mp && (mp.status === 'PENDING' || mp.status === 'IN_PROCESS' || mp.status === 'REJECTED')

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-brand-100 bg-white p-8">
      <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.number}</h1>
      <p className="mt-2 text-muted">Total {formatARS(order.total.toString())}.</p>
      {mp && <p className="mt-2 text-sm">{paymentCopy[mp.status] ?? mp.status}</p>}
      {params.mp === 'error' && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No pudimos abrir Mercado Pago. Probá de nuevo con el botón de abajo.
        </p>
      )}
      {params.mp === 'failure' && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          El pago no se completó. Podés intentar otra vez.
        </p>
      )}

      {transfer && (
        <div className="mt-6 rounded-lg bg-brand-50 p-4 text-sm">
          <p className="font-semibold">Transferí a esta cuenta</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>Titular: {settings.bankAccount.titular || 'Completar en el panel'}</li>
            <li>Banco: {settings.bankAccount.banco || '—'}</li>
            <li>CBU: {settings.bankAccount.cbu || '—'}</li>
            <li>Alias: {settings.bankAccount.alias || '—'}</li>
          </ul>
          <p className="mt-3">
            Cuando tengas el comprobante, avisanos desde{' '}
            <Link href="/mi-cuenta" className="text-brand-600 hover:underline">
              Mi cuenta
            </Link>
            . El admin lo marca como pagado.
          </p>
        </div>
      )}

      {mpPending && (
        <form
          className="mt-6"
          action={async () => {
            'use server'
            await resumeMercadoPagoPayment(order.id)
          }}
        >
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
            Pagar con Mercado Pago
          </button>
        </form>
      )}

      <Link href="/" className="mt-8 inline-block font-medium text-brand-600 hover:underline">
        Volver a la tienda
      </Link>
    </div>
  )
}
