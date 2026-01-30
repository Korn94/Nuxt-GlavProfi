// plugins/socket.client.ts
import { defineNuxtPlugin } from "nuxt/app"
import { useSocketStore } from "stores/socket"

export default defineNuxtPlugin(async () => {
  // Инициализируем хранилище с задержкой
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const socketStore = useSocketStore()
  
  // Проверяем, что хранилище готово
  if (typeof socketStore.init === 'function') {
    socketStore.init()
  }
})
