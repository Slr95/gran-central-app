'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveStoreSettings } from './actions'
import type { StoreSettings } from '@/lib/settings'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  )
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction] = useActionState(saveStoreSettings, undefined)
  const input = 'mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500'

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-6 rounded-xl border border-brand-100 bg-white p-6">
      <label className="block text-sm font-medium">
        Descuento por transferencia (%)
        <input
          name="transferDiscountPercent"
          type="number"
          min={0}
          max={50}
          defaultValue={settings.transferDiscountPercent}
          className={input}
        />
      </label>
      <label className="block text-sm font-medium">
        Envío gratis a partir de ($)
        <input
          name="freeShippingThreshold"
          type="number"
          min={0}
          defaultValue={settings.freeShippingThreshold ?? 0}
          className={input}
        />
      </label>
      <label className="block text-sm font-medium">
        WhatsApp (código país + número, sin +)
        <input name="whatsapp" defaultValue={settings.whatsapp} className={input} placeholder="5493411234567" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Titular
          <input name="titular" defaultValue={settings.bankAccount.titular} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Banco
          <input name="banco" defaultValue={settings.bankAccount.banco} className={input} />
        </label>
        <label className="block text-sm font-medium">
          CBU
          <input name="cbu" defaultValue={settings.bankAccount.cbu} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Alias
          <input name="alias" defaultValue={settings.bankAccount.alias} className={input} />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">Guardado.</p>}
      <Submit />
    </form>
  )
}
