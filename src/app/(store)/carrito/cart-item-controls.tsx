'use client'

import { useTransition } from 'react'
import { removeCartItem, updateCartItem } from './actions'

export function CartItemControls({ itemId, quantity }: { itemId: string; quantity: number }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void updateCartItem(itemId, quantity - 1))}
        className="size-8 rounded-md border border-brand-200 hover:bg-brand-50 disabled:opacity-50"
      >
        −
      </button>
      <span className="w-6 text-center text-sm">{quantity}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void updateCartItem(itemId, quantity + 1))}
        className="size-8 rounded-md border border-brand-200 hover:bg-brand-50 disabled:opacity-50"
      >
        +
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void removeCartItem(itemId))}
        className="ml-2 text-sm text-muted hover:text-red-600"
      >
        Quitar
      </button>
    </div>
  )
}
