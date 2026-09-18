import { prisma } from '@/lib/prisma'

export type BankAccount = {
  cbu: string
  alias: string
  titular: string
  banco: string
}

export type StoreSettings = {
  transferDiscountPercent: number
  bankAccount: BankAccount
  whatsapp: string
  freeShippingThreshold: number | null
}

const defaults: StoreSettings = {
  transferDiscountPercent: 7,
  bankAccount: { cbu: '', alias: '', titular: '', banco: '' },
  whatsapp: '',
  freeShippingThreshold: 900000,
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.storeSetting.findMany()
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))

  const bank = (map['payments.bankAccount'] ?? {}) as Partial<BankAccount>

  return {
    transferDiscountPercent: asNumber(map['payments.transferDiscountPercent'], defaults.transferDiscountPercent),
    bankAccount: {
      cbu: asString(bank.cbu),
      alias: asString(bank.alias),
      titular: asString(bank.titular),
      banco: asString(bank.banco),
    },
    whatsapp: asString(map['store.whatsapp']),
    freeShippingThreshold:
      map['store.freeShippingThreshold'] === null
        ? null
        : asNumber(map['store.freeShippingThreshold'], defaults.freeShippingThreshold ?? 0),
  }
}
