import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Province } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

const ADMIN_EMAIL = 'admin@grancentral.com.ar'
const ADMIN_PASSWORD = 'GranCentral2026!'

async function main() {
  // Todo el seed usa upsert por slug/email para que se pueda volver a correr
  // sin duplicar nada.
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      name: 'Administrador',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    },
  })

  const categories = [
    { name: 'Living', slug: 'living', description: 'Sillones, mesas ratonas y racks', position: 1 },
    { name: 'Dormitorio', slug: 'dormitorio', description: 'Camas, placares y mesas de luz', position: 2 },
    { name: 'Comedor', slug: 'comedor', description: 'Mesas, sillas y vajilleros', position: 3 },
    { name: 'Oficina', slug: 'oficina', description: 'Escritorios y sillas de trabajo', position: 4 },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  const living = await prisma.category.findUniqueOrThrow({ where: { slug: 'living' } })
  const dormitorio = await prisma.category.findUniqueOrThrow({ where: { slug: 'dormitorio' } })

  const products = [
    {
      name: 'Sillón Bariloche 3 cuerpos',
      slug: 'sillon-bariloche-3-cuerpos',
      categoryId: living.id,
      description:
        'Sillón de tres cuerpos con estructura de eucalipto y tapizado en chenille. Patas de madera maciza.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
      variants: [
        {
          sku: 'SIL-BAR-3-GRIS',
          name: 'Chenille gris',
          price: '899000.00',
          compareAtPrice: '1150000.00',
          stock: 4,
          isOversized: true,
          requiresAssembly: false,
          weightKg: '68.00',
          lengthCm: 210,
          widthCm: 90,
          heightCm: 85,
        },
        {
          sku: 'SIL-BAR-3-BEIGE',
          name: 'Chenille beige',
          price: '899000.00',
          compareAtPrice: '1150000.00',
          stock: 2,
          isOversized: true,
          requiresAssembly: false,
          weightKg: '68.00',
          lengthCm: 210,
          widthCm: 90,
          heightCm: 85,
        },
      ],
    },
    {
      name: 'Mesa ratona Nórdica',
      slug: 'mesa-ratona-nordica',
      categoryId: living.id,
      description: 'Mesa ratona en paraíso macizo con terminación al agua. Se entrega armada.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=1200&q=80',
      variants: [
        {
          sku: 'MES-NOR-100',
          name: '100 x 50 cm',
          price: '215000.00',
          compareAtPrice: null,
          stock: 12,
          isOversized: false,
          requiresAssembly: false,
          weightKg: '14.00',
          lengthCm: 100,
          widthCm: 50,
          heightCm: 42,
        },
      ],
    },
    {
      name: 'Cama Queen con cajones',
      slug: 'cama-queen-con-cajones',
      categoryId: dormitorio.id,
      description: 'Base de cama queen 160x200 con cuatro cajones y respaldo tapizado.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
      variants: [
        {
          sku: 'CAM-QUE-CAJ',
          name: '160 x 200 cm',
          price: '1240000.00',
          compareAtPrice: '1490000.00',
          stock: 3,
          isOversized: true,
          requiresAssembly: true,
          weightKg: '95.00',
          lengthCm: 205,
          widthCm: 165,
          heightCm: 110,
        },
      ],
    },
  ]

  for (const { variants, image, ...product } of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, status: 'ACTIVE' },
      create: { ...product, status: 'ACTIVE' },
    })

    await prisma.productImage.deleteMany({ where: { productId: created.id } })
    await prisma.productImage.create({
      data: { productId: created.id, url: image, alt: product.name, position: 0 },
    })

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { ...variant, productId: created.id },
        create: { ...variant, productId: created.id },
      })
    }
  }

  // Zonas de envío. La del interior no acepta bultos grandes: un ropero o una
  // cama no entran en los correos, y hay que cotizar flete aparte.
  const existingZones = await prisma.shippingZone.count()
  if (existingZones === 0) {
    await prisma.shippingZone.create({
      data: {
        name: 'Rosario y alrededores',
        provinces: [Province.SANTA_FE],
        postalCodes: ['2000', '2001', '2002'],
        position: 1,
        rates: {
          create: [
            {
              name: 'Retiro en showroom',
              methodType: 'PICKUP',
              price: '0.00',
              allowsOversized: true,
              estimatedDaysMin: 1,
              estimatedDaysMax: 2,
            },
            {
              name: 'Flete propio con armado',
              methodType: 'OWN_DELIVERY',
              price: '35000.00',
              freeOverAmount: '900000.00',
              allowsOversized: true,
              includesAssembly: true,
              estimatedDaysMin: 3,
              estimatedDaysMax: 7,
            },
          ],
        },
      },
    })

    await prisma.shippingZone.create({
      data: {
        name: 'Resto del país',
        provinces: Object.values(Province),
        postalCodes: [],
        position: 2,
        rates: {
          create: [
            {
              name: 'Envío por correo',
              methodType: 'CARRIER',
              price: '48000.00',
              maxWeightKg: '30.00',
              allowsOversized: false,
              estimatedDaysMin: 5,
              estimatedDaysMax: 12,
            },
          ],
        },
      },
    })
  }

  const settings: Array<{ key: string; value: unknown }> = [
    // Con comisión de Mercado Pago en 6,29% + IVA (~7,6%), cualquier descuento
    // por transferencia debajo de ese número mejora el margen.
    { key: 'payments.transferDiscountPercent', value: 7 },
    { key: 'payments.bankAccount', value: { cbu: '', alias: '', titular: '', banco: '' } },
    { key: 'store.whatsapp', value: '' },
    { key: 'store.freeShippingThreshold', value: 900000 },
  ]

  for (const setting of settings) {
    await prisma.storeSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value as never },
    })
  }

  console.log(`Admin: ${admin.email} / ${ADMIN_PASSWORD}`)
  console.log('Seed completo.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
