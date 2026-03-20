// server/utils/imageValidation.ts

// Максимальный размер файла — 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Magic bytes для каждого формата
const imageMagicBytes: Record<string, (buf: Buffer) => boolean> = {
  jpg: (buf) => buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  jpeg: (buf) => buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  png: (buf) => buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47,
  webp: (buf) => buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50,
  avif: (buf) => buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70,
}

export const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'avif']

export const validateImage = (file: { data: Buffer, filename: string }) => {
  // Проверка размера
  if (file.data.length > MAX_FILE_SIZE) {
    return { valid: false, error: `Файл ${file.filename} превышает максимальный размер 10MB` }
  }

  // Проверка расширения
  const ext = file.filename.split('.').pop()?.toLowerCase() || ''
  if (!allowedExt.includes(ext)) {
    return { valid: false, error: `Недопустимый формат файла: ${ext}` }
  }

  // Проверка magic bytes
  const checkMagic = imageMagicBytes[ext]
  if (!checkMagic || !checkMagic(file.data)) {
    return { valid: false, error: `Файл ${file.filename} не соответствует формату ${ext}` }
  }

  return { valid: true, error: null }
}
