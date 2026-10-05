// server/types/busboy.d.ts
//
// Пакет `busboy` не поставляет собственных типов (нет `index.d.ts`).
// Это минимальное амбиентное объявление для типов TS.

declare module 'busboy' {
  import { Readable } from 'node:stream'

  interface BusboyLimits {
    fieldSize?: number
    fields?: number
    fileSize?: number
    files?: number
    parts?: number
  }

  interface BusboyOptions {
    headers: Record<string, string | string[] | undefined>
    limits?: BusboyLimits
  }

  interface FileInfo {
    filename: string
    encoding: string
    mimeType: string
  }

  interface Busboy extends NodeJS.WritableStream {
    on(event: 'field', listener: (name: string, value: string, info: { nameTruncated: boolean; valueTruncated: boolean; encoding: string; mimeType: string }) => void): this
    on(event: 'file', listener: (name: string, stream: Readable, info: FileInfo) => void): this
    on(event: 'filesLimit' | 'fieldsLimit' | 'partsLimit', listener: () => void): this
    on(event: 'close', listener: () => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: string | symbol, listener: (...args: any[]) => void): this
    destroy(error?: Error): void
  }

  const busboy: (options: BusboyOptions) => Busboy
  export default busboy
}
