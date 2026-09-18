import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const CLOUDINARY_FOLDER = 'gran-central/productos'

/**
 * Firma una subida para que el navegador suba el archivo directo a Cloudinary.
 * El archivo nunca pasa por nuestro servidor: las fotos de muebles son pesadas
 * y el límite de body de una serverless function es de pocos MB.
 */
export function signUpload(timestamp: number) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) {
    throw new Error('Falta CLOUDINARY_API_SECRET')
  }

  return cloudinary.utils.api_sign_request(
    { timestamp, folder: CLOUDINARY_FOLDER },
    apiSecret,
  )
}

export async function destroyImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}
