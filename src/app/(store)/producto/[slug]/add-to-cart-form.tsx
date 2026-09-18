'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/app/(store)/carrito/actions'
import { formatARS } from '@/lib/utils'

type VariantOption = {
  id: string
  name: string
  price: string
  compareAtPrice: string | null
  stock: number
  allowBackorder: boolean
  isOversized: boolean
  requiresAssembly: boolean
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? 'Agregando…' : 'Agregar al carrito'}
    </button>
  )
}

export function AddToCartForm({ variants }: { variants: VariantOption[] }) {
  const [state, formAction] = useActionState(addToCart, undefined)

  return (
    <form action={formAction} className="mt-8">
      <label htmlFor="variantId" className="text-sm font-medium">
        Variante
      </label>
      <select
        id="variantId"
        name="variantId"
        required
        className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
      >
        {variants.map((variant) => {
          const available = variant.stock > 0 || variant.allowBackorder
          return (
            <option key={variant.id} value={variant.id} disabled={!available}>
              {variant.name} — {formatARS(variant.price)}
              {!available ? ' (sin stock)' : variant.stock <= 3 ? ` (${variant.stock} disponibles)` : ''}
            </option>
          )
        })}
      </select>

      <label htmlFor="quantity" className="mt-4 block text-sm font-medium">
        Cantidad
      </label>
      <input
        id="quantity"
        name="quantity"
        type="number"
        min={1}
        defaultValue={1}
        className="mt-1 w-24 rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />

      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Lo agregamos al carrito.
        </p>
      )}

      <SubmitButton disabled={variants.every((variant) => variant.stock <= 0 && !variant.allowBackorder)} />
    </form>
  )
}
