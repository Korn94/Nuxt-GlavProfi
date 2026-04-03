// composables/useImageUrl.ts

import { useRuntimeConfig } from "nuxt/app"

/**
 * Формирует правильный URL для загруженных изображений
 * - В продакшене: возвращает относительный путь (отдаётся через Nginx)
 * - В разработке: подставляет адрес сервера из runtimeConfig
 * 
 * @param path - путь из БД, например: '/uploads/case-11/photo.jpg'
 * @returns Полный или относительный URL для тега <img>
 */
export const useImageUrl = (path: string | null | undefined): string => {
  if (!path) return ''
  
  const config = useRuntimeConfig()
  
  // В режиме разработки подставляем базовый адрес сервера
  if (process.dev && config.public.uploadsBaseUrl) {
    // Убираем дублирующие слеши и склеиваем
    const base = config.public.uploadsBaseUrl.replace(/\/+$/, '')
    const url = path.startsWith('/') ? path : `/${path}`
    return `${base}${url}`
  }
  
  // В продакшене отдаём как есть (относительный путь)
  // Nginx сам обработает /uploads/*
  return path
}
