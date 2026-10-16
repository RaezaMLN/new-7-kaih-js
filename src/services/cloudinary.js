import imageCompression from 'browser-image-compression'

/**
 * Compress an image file before upload to save bandwidth & storage
 * @param {File} file - Original image file
 * @param {number} maxSizeMB - Target max size in MB (default: 0.25 = 250KB)
 * @param {number} maxWidthOrHeight - Max dimension in px (default: 1280)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, maxSizeMB = 0.25, maxWidthOrHeight = 1280) {
  if (!file || !file.type.startsWith('image/')) {
    return file
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp'
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.warn('Image compression warning, using original file:', error)
    return file
  }
}

/**
 * Upload an image directly to Cloudinary using Unsigned Preset
 * @param {File} file - The file to upload
 * @param {string} folder - Target folder in Cloudinary (e.g. '7kaih/attendance' or '7kaih/journals')
 * @returns {Promise<{ url: string, publicId: string, secureUrl: string }>}
 */
export async function uploadToCloudinary(file, folder = '7kaih/general') {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  // 1. Compress image first in browser
  const compressed = await compressImage(file)

  // 2. If Cloudinary credentials are not configured yet, fallback to local Data URL
  // so the user can test all features seamlessly without error!
  if (!cloudName || !uploadPreset || cloudName === 'your_cloudinary_cloud_name') {
    console.info('Cloudinary credentials not set in .env. Using local DataURL preview mode.')
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve({
          url: reader.result,
          secureUrl: reader.result,
          publicId: 'local_' + Date.now()
        })
      }
      reader.readAsDataURL(compressed)
    })
  }

  // 3. Direct upload via FormData to Cloudinary API
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || `Upload gagal dengan status ${response.status}`)
  }

  const result = await response.json()
  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height
  }
}
