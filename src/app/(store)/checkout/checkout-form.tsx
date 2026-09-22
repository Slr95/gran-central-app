'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { placeOrder } from './actions'
import { PROVINCE_OPTIONS } from '@/lib/provinces'
import { formatARS } from '@/lib/utils'

type RateOption = {
  id: string
  name: string
  methodType: 'CARRIER' | 'OWN_DELIVERY' | 'PICKUP'
  price: string
  freeOverAmount: string | null
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
  allowsOversized: boolean
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Confirmando…' : 'Continuar al pago'}
    </button>
  )
}

export function CheckoutForm({
  rates,
  hasOversized,
  transferDiscountPercent,
  subtotal,
  mercadoPagoReady,
}: {
  rates: RateOption[]
  hasOversized: boolean
  transferDiscountPercent: number
  subtotal: number
  mercadoPagoReady: boolean
}) {
  const [state, formAction] = useActionState(placeOrder, undefined)

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="font-semibold">Datos de entrega</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Quién recibe" name="recipient" required />
          <Field label="Teléfono" name="phone" required />
          <Field label="DNI" name="dni" />
          <Field label="Calle" name="street" required />
          <Field label="Número" name="number" required />
          <Field label="Depto / piso" name="apartment" />
          <Field label="Ciudad" name="city" required defaultValue="Rosario" />
          <div>
            <label htmlFor="province" className="block text-sm font-medium">
              Provincia
            </label>
            <select
              id="province"
              name="province"
              defaultValue="SANTA_FE"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {PROVINCE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Field label="Código postal" name="postalCode" required defaultValue="2000" />
        </div>
        <label htmlFor="notes" className="mt-4 block text-sm font-medium">
          Notas para la entrega
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="font-semibold">Envío</h2>
        {hasOversized && (
          <p className="mt-2 text-sm text-amber-800">
            Hay un bulto voluminoso: solo aparecen métodos que aceptan colchones y sommiers.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {rates.length === 0 && <p className="text-sm text-muted">No hay envíos disponibles para este carrito.</p>}
          {rates.map((rate) => {
            const free =
              rate.freeOverAmount && subtotal >= Number(rate.freeOverAmount)
                ? true
                : rate.methodType === 'PICKUP'
            const eta =
              rate.estimatedDaysMin && rate.estimatedDaysMax
                ? `${rate.estimatedDaysMin}–${rate.estimatedDaysMax} días`
                : null
            return (
              <label
                key={rate.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-100 p-3 has-checked:border-brand-500"
              >
                <input type="radio" name="shippingRateId" value={rate.id} required className="mt-1" />
                <span className="flex-1 text-sm">
                  <span className="font-medium">{rate.name}</span>
                  {eta && <span className="text-muted"> · {eta}</span>}
                  <span className="mt-0.5 block font-semibold">
                    {free ? 'Gratis' : formatARS(rate.price)}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="font-semibold">Pago</h2>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-100 p-3 has-checked:border-brand-500">
            <input type="radio" name="paymentProvider" value="BANK_TRANSFER" defaultChecked className="mt-1" />
            <span className="text-sm">
              <span className="font-medium">Transferencia bancaria</span>
              <span className="mt-0.5 block text-muted">
                {transferDiscountPercent}% de descuento. Te pasamos CBU/alias al confirmar.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-100 p-3 has-checked:border-brand-500">
            <input
              type="radio"
              name="paymentProvider"
              value="MERCADO_PAGO"
              disabled={!mercadoPagoReady}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Mercado Pago</span>
              <span className="mt-0.5 block text-muted">
                Tarjetas, cuotas, dinero en cuenta y Rapipago/Pago Fácil.
                {!mercadoPagoReady && ' Falta cargar MP_ACCESS_TOKEN en el .env.'}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-100 p-3 has-checked:border-brand-500">
            <input type="radio" name="paymentProvider" value="CASH_ON_PICKUP" className="mt-1" />
            <span className="text-sm">
              <span className="font-medium">Efectivo en showroom</span>
              <span className="mt-0.5 block text-muted">Solo si elegís retiro en el local.</span>
            </span>
          </label>
        </div>
      </section>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function Field({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string
  name: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
    </div>
  )
}
