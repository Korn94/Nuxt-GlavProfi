// app/components/pages/Cabinet/Diagnostics/shared/types.ts
/**
 * Общие типы блоков страницы «Диагностика».
 */

/** Строка списка «ключ → значение» (карточки «Соединение», «Пользователь», «Сессия»). */
export interface KvRow {
  k: string
  v: string
  /** Доп. класс значения: kv__v--ok | kv__v--warn | kv__v--err | kv__v--mono */
  cls?: string
}

/** Кнопка быстрой отправки socket-события (карточка «Тест событий»). */
export interface QuickEvent {
  label: string
  /** Модификатор .btn--* (ok | warn | dim | primary | sm) */
  color: string
  event: string
  payload: () => unknown
  disabled: boolean
}
