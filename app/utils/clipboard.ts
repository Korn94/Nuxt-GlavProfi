// app/utils/clipboard.ts
/**
 * Надёжное копирование текста в буфер обмена.
 * ✅ SSR-безопасен (на сервере ничего не делает и возвращает false).
 * ✅ Приоритет: современное Clipboard API → резервный <textarea> + document.execCommand('copy').
 * ✅ Возвращает Promise<boolean> — успех/неудача, чтобы вызывающий код мог показать уведомление.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // На сервере (SSR) буфера обмена нет
  if (typeof document === 'undefined') return false

  // 1. Современное Clipboard API (требует secure context: https:// или http://localhost)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Clipboard API недоступен/отклонён — пробуем резервный способ
  }

  // 2. Резервный способ: скрытый textarea + execCommand('copy')
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;width:1px;height:1px'
  document.body.appendChild(textArea)

  try {
    textArea.focus()
    textArea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textArea)
  }
}