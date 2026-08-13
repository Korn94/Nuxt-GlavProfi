// app/components/pages/public/remontPomescheniy/composables/useGridControls.ts
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface GridTab {
  key: string
  label: string
}

export interface GridItem {
  slug: string
  [key: string]: any
}

export function useGridControls<T extends GridItem>(
  items: () => T[],
  tabs: GridTab[] = [{ key: 'all', label: 'Все' }]
) {
  const activeTab = ref('all')
  const viewMode = ref<'list' | 'grid'>('grid')
  const showAll = ref(false)
  const animatedSlugs = ref(new Set<string>())
  const screenWidth = ref(0)
  const isMounted = ref(false)

  const INITIAL_LIMIT = 3
  const DESKTOP_BREAKPOINT = 900

  // Фильтрация по активному табу
  const filteredItems = computed(() => {
    const allItems = items()
    if (activeTab.value === 'all') return allItems
    return allItems.filter((item: any) => item.category === activeTab.value)
  })

  // Видимые элементы (с учётом лимита на мобильных)
  const visibleItems = computed(() => {
    if (screenWidth.value >= DESKTOP_BREAKPOINT) {
      return filteredItems.value
    }
    
    if (activeTab.value === 'all' && !showAll.value) {
      return filteredItems.value.slice(0, INITIAL_LIMIT)
    }
    return filteredItems.value
  })

  // Можно ли показать кнопку "Показать ещё"
  const canShowMore = computed(() => {
    if (!isMounted.value) return false
    return screenWidth.value < DESKTOP_BREAKPOINT && 
           activeTab.value === 'all' && 
           !showAll.value &&
           filteredItems.value.length > INITIAL_LIMIT
  })

  // Переключение табов с анимацией
  const setTab = (key: string) => {
    if (activeTab.value === key) {
      // Повторный клик - перезапускаем анимацию
      animatedSlugs.value = new Set()
      visibleItems.value.forEach((item, index) => {
        setTimeout(() => {
          animatedSlugs.value.add(item.slug)
        }, index * 50)
      })
      return
    }
    activeTab.value = key
    showAll.value = false
    animatedSlugs.value = new Set()
  }

  // Переключение вида
  const toggleView = () => {
    viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
  }

  // Показать все элементы
  const showAllItems = () => {
    showAll.value = true
  }

  // Анимация при изменении видимых элементов
  watch(visibleItems, async (newItems) => {
    await nextTick()
    newItems.forEach((item, index) => {
      setTimeout(() => {
        animatedSlugs.value.add(item.slug)
      }, index * 50)
    })
  }, { immediate: true })

  // Обработчик ресайза
  const handleResize = () => {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    screenWidth.value = window.innerWidth
    isMounted.value = true
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    // State
    activeTab,
    viewMode,
    showAll,
    animatedSlugs,
    screenWidth,
    isMounted,
    
    // Computed
    filteredItems,
    visibleItems,
    canShowMore,
    
    // Methods
    setTab,
    toggleView,
    showAllItems,
    
    // Constants
    INITIAL_LIMIT,
    DESKTOP_BREAKPOINT,
    tabs
  }
}
