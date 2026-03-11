// server/plugins/socket.io.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'

// ✅ Статические импорты — Rollup видит их при сборке
import { initSocketDev } from '../socket/dev'
import { initSocketProd } from '../socket/prod'

export default defineNitroPlugin((nitroApp) => {
  const isDev = process.env.NODE_ENV !== 'production'
  
  console.log(`[SocketEntry] 📦 Загрузка модуля для ${isDev ? 'development' : 'production'}...`)
  
  // ✅ Вызываем обычную функцию, а не динамический импорт
  if (isDev) {
    initSocketDev(nitroApp)
  } else {
    initSocketProd(nitroApp)
  }
})
