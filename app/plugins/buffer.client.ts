// app/plugins/buffer.client.ts
import { Buffer } from 'buffer'
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined' && !(window as any).Buffer) {
    ;(window as any).Buffer = Buffer
    ;(window as any).global = window
  }
})
