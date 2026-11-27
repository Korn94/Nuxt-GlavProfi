// app/types/window.d.ts
//
// Глобальные расширения window, которые ставят клиентские плагины.
// Отдельный файл (а не app/types/global.d.ts), потому что `declare global`
// допустим только во внешнем модуле — здесь его роль играет `export {}`.

export {}

declare global {
  interface Window {
    /**
     * Обёртка Яндекс.Метрики с уже подставленным номером счётчика:
     * `$ym('reachGoal', 'FORM_SUBMITTED')` === `ym(93400187, 'reachGoal', 'FORM_SUBMITTED')`.
     * Ставится в app/plugins/yandexMetrica.client.js. В dev отсутствует
     * (плагин работает только в production) — поэтому проверяем на function.
     */
    $ym?: (method: string, ...args: unknown[]) => void
  }
}
