import { z } from 'zod'

/** Los inputs numéricos del form llegan como string, y vacío significa "sin dato". */
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().nonnegative().nullable(),
)

const optionalInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().nonnegative().nullable(),
)

const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().nullable(),
)

export const variantSchema = z
  .object({
    id: z.string().optional(),
    sku: z.string().trim().min(1, 'El SKU es obligatorio').max(60),
    name: z.string().trim().min(1, 'La variante necesita un nombre').max(120),
    price: z.preprocess((v) => Number(v), z.number().positive('El precio debe ser mayor a cero')),
    compareAtPrice: optionalNumber,
    stock: z.preprocess((v) => Number(v), z.number().int().min(0)),
    allowBackorder: z.boolean(),
    isActive: z.boolean(),
    weightKg: optionalNumber,
    lengthCm: optionalInt,
    widthCm: optionalInt,
    heightCm: optionalInt,
    isOversized: z.boolean(),
    requiresAssembly: z.boolean(),
  })
  .refine((v) => v.compareAtPrice === null || v.compareAtPrice > v.price, {
    // Si el precio tachado no es mayor, la oferta muestra un descuento negativo.
    message: 'El precio de lista tiene que ser mayor al precio de venta',
    path: ['compareAtPrice'],
  })

export const productImageSchema = z.object({
  url: z.url(),
  publicId: z.string().nullable(),
  alt: optionalText,
})

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, 'El nombre es obligatorio').max(160),
  slug: z
    .string()
    .trim()
    .min(3, 'El slug es obligatorio')
    .regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones'),
  description: optionalText,
  shortDescription: optionalText,
  categoryId: optionalText,
  brand: optionalText,
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  isFeatured: z.boolean(),
  metaTitle: optionalText,
  metaDescription: optionalText,
  images: z.array(productImageSchema),
  variants: z.array(variantSchema).min(1, 'Cargá al menos una variante'),
})

export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type ProductImageInput = z.infer<typeof productImageSchema>
