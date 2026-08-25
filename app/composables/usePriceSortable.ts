// app/composables/usePriceSortable.ts
/**
 * 🧲 Сортировка перетаскиванием (drag & drop) для прайс-листа.
 *
 * Основана на `vue-draggable-plus` (обёртка над SortableJS).
 * Работает с ГЛУБОКО вложенными массивами Pinia-стора, поэтому НЕ передаёт
 * список в `useDraggable` (библиотека заменяла бы массив целиком через `.value`):
 * мы вешаем Sortable на контейнер (как библиотеку «в режиме DOM»), а после
 * перестановки самостоятельно мутируем реальный reactive-массив стора и
 * вызываем `dataStore.reorderItems(entity, items)` — с оптимистичным
 * обновлением и откатом при ошибке.
 *
 * Драг доступен ТОЛЬКО в режиме админа (enabled) и отключается при активном
 * поиске — потому что при поиске списки — это копии, и мутировать стор нельзя.
 */
import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { useDraggable, type UseDraggableReturn } from 'vue-draggable-plus'
import { usePriceDataStore } from 'stores/price'
import type { PriceEntity, ReorderItem } from 'stores/price/types'

export interface UsePriceSortableOptions {
  /** Контейнер списка, куда вешается Sortable (template ref) */
  el: Ref<HTMLElement | null>
  /** Сущность для reorder-эндпоинта: 'subcategories' | 'items' */
  entity: PriceEntity
  /**
   * Геттер реального reactive-массива стора (например `() => category.subcategories`).
   * Возвращает текущий массив, лежащий в `dataStore.works`.
   */
  list: () => Array<{ id: number; order?: number }>
  /** Активен ли drag (админ-режим и отсутствие активного поиска) */
  isEnabled: () => boolean
  /** Селектор элемента-«ручки», за который начинается перенос (Sortable handle) */
  handle?: string
  /** Селектор только перетаскиваемых элементов внутри контейнера */
  draggable?: string
  /** Селектор элементов, которые нельзя перетаскивать */
  filter?: string
}

export function usePriceSortable(options: UsePriceSortableOptions) {
  // Sortable зависит от DOM — на сервере делаем no-op.
  if (import.meta.server) {
    return { isDragging: ref(false) }
  }

  const dataStore = usePriceDataStore()
  const isDragging = ref(false)
  // Хендлер сортабла (console: pause/resume/start/destroy/option)
  let sortableRef: UseDraggableReturn | null = null

  // Запускаем сортабл, как только появился контейнер в DOM.
  const ensureStarted = () => {
    if (!sortableRef) return
    if (options.el.value) {
      sortableRef.start(options.el.value)
    }
  }

  // Пересчитываем disabled сортабла по текущему enabled().
  const applyEnabled = () => {
    if (!sortableRef) return
    if (options.isEnabled()) {
      sortableRef.resume()
    } else {
      sortableRef.pause()
    }
  }

  sortableRef = useDraggable(options.el, {
    // Не создаём сразу — дожидаемся появления el и вызываем start().
    immediate: false,
    animation: 150,
    ghostClass: 'price-sort-ghost',
    chosenClass: 'price-sort-chosen',
    dragClass: 'price-sort-drag',
    // Ограничиваем перетаскивание: только по ручке
    handle: options.handle,
    draggable: options.draggable,
    filter: options.filter,
    onStart: () => {
      isDragging.value = true
    },
    onEnd: (evt: any) => {
      isDragging.value = false
      const { oldIndex, newIndex } = evt
      // Ничего не изменилось или нет индексов — выходим.
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return

      const arr = options.list()
      if (!arr || arr.length === 0) return

      // Sortable уже переставил DOM. Вычисляем целевой порядок на копии массива,
      // НЕ мутируя реактивный массив — это позволит reorderItems корректно сделать
      // снапшот «до» и откатить порядок при ошибке сохранения.
      const reordered = [...arr]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const items: ReorderItem[] = reordered.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }))
      persist(items)
    },
  })

  const persist = async (items: ReorderItem[]) => {
    try {
      await dataStore.reorderItems(options.entity, items)
    } catch (err) {
      console.warn(`[usePriceSortable] ❌ Не удалось сохранить порядок ${options.entity}:`, err)
    }
  }

  // Ждём появления контейнера (template ref ставится после mount).
  watch(
    () => options.el.value,
    (el) => {
      if (el) {
        ensureStarted()
        applyEnabled()
      }
    },
    { immediate: true },
  )

  // Реактивно включаем/выключаем drag при смене enabled (поиск / режим админа).
  watch(
    () => options.isEnabled(),
    () => applyEnabled(),
    { immediate: true },
  )

  onBeforeUnmount(() => {
    sortableRef?.destroy()
    sortableRef = null
  })

  return { isDragging, applyEnabled }
}