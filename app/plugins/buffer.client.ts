// app/plugins/buffer.client.ts
import { defineNuxtPlugin } from 'nuxt/app';

/**
 * Полифилл `window.Buffer` для socket.io-client.
 *
 * ⚡ Пакет `buffer` (~9 КБ gzip) грузится ДИНАМИЧЕСКИ: на публичных страницах
 * для анонимных посетителей он не нужен вообще, а статический импорт держал его
 * в entry-чанке на каждой странице. Полифилл всё равно успевает примениться
 * задолго до первого подключения сокета (это действие пользователя).
 */
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined' || (window as any).Buffer) return;

  void import('buffer').then(({ Buffer }) => {
    if (!(window as any).Buffer) {
      ;(window as any).Buffer = Buffer
      ;(window as any).global = window
    }
  })
})
