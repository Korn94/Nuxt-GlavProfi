// app/components/pages/public/remontPomescheniy/pageTypes/composables/useStickyNav.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

interface UseStickyNavOptions {
  sectionIds: Ref<string[]> | (() => string[])
  scrollOffset?: number
  scrollLockDuration?: number
}

export function useStickyNav(options: UseStickyNavOptions) {
  const { scrollOffset = 120, scrollLockDuration = 900 } = options

  const activeId = ref<string | null>(null)
  const isSticky = ref(false)
  const isScrollLocked = ref(false)

  const activeLinePx = ref(
    typeof window !== 'undefined' ? Math.round(window.innerHeight / 2) : 400
  )

  let sentinelObserver: IntersectionObserver | null = null
  let sentinelEl: HTMLElement | null = null
  let scrollLockTimeout: ReturnType<typeof setTimeout> | null = null
  let rafId: number | null = null
  let isListeningScroll = false

  const getSectionIds = (): string[] => {
    const src = options.sectionIds
    return typeof src === 'function' ? src() : src.value
  }

  const updateActiveLine = () => {
    activeLinePx.value = Math.round(window.innerHeight / 2)
  }

  // === Определение активной секции по центру экрана ===
  const updateActiveSection = () => {
    if (isScrollLocked.value) return

    const sectionIds = getSectionIds()
    if (sectionIds.length === 0) return

    const line = activeLinePx.value

    const scrollBottom = window.scrollY + window.innerHeight
    const docHeight = document.documentElement.scrollHeight
    const isAtBottom = scrollBottom >= docHeight - 5

    if (isAtBottom) {
      const lastId = sectionIds[sectionIds.length - 1] ?? null
      if (lastId && activeId.value !== lastId) {
        activeId.value = lastId
      }
      return
    }

    let bestId: string | null = null
    let bestTop = -Infinity

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (!el) continue

      const rect = el.getBoundingClientRect()
      if (rect.top <= line && rect.bottom > 0) {
        if (rect.top > bestTop) {
          bestTop = rect.top
          bestId = id
        }
      }
    }

    if (!bestId && sectionIds.length > 0) {
      bestId = sectionIds[0] ?? null
    }

    if (bestId && activeId.value !== bestId) {
      activeId.value = bestId
    }
  }

  const handleScroll = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      updateActiveSection()
      rafId = null
    })
  }

  // === Observer для sentinel'а: БЕЗ агрессивного rootMargin ===
  const observeSentinel = () => {
    sentinelEl = document.querySelector('[data-sticky-nav-sentinel]') as HTMLElement
    if (!sentinelEl) return

    // ✅ Убрали rootMargin '-80px'. Теперь sentinel считается невидимым
    // только когда его верхняя граница пересекает верх viewport.
    sentinelObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        
        // ✅ Дополнительная проверка: если скролл в самом верху (< 10px),
        // принудительно считаем меню НЕ прилипшим, чтобы избежать дублирования
        const isAtTop = window.scrollY < 10
        
        if (isAtTop) {
          isSticky.value = false
        } else {
          isSticky.value = !entry.isIntersecting
        }
      },
      { 
        threshold: [0, 1], // ✅ Срабатывает при 0% и 100% видимости
        // Без rootMargin — sentinel выходит за верх viewport естественным образом
      }
    )

    sentinelObserver.observe(sentinelEl)
  }

  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) {
      console.warn(`[StickyNav] Секция #${id} не найдена`)
      return
    }

    if (scrollLockTimeout) clearTimeout(scrollLockTimeout)

    isScrollLocked.value = true
    activeId.value = id

    const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset
    window.scrollTo({ top, behavior: 'smooth' })

    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `#${id}`)
    }

    scrollLockTimeout = setTimeout(() => {
      isScrollLocked.value = false
      updateActiveSection()
    }, scrollLockDuration)
  }

  onMounted(() => {
    requestAnimationFrame(() => {
      // ✅ Небольшая задержка, чтобы Hero-блок успел отрендериться полностью
      setTimeout(() => {
        observeSentinel()
      }, 50)

      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', updateActiveLine, { passive: true })
      isListeningScroll = true

      updateActiveLine()
      updateActiveSection()

      const hash = window.location.hash.slice(1)
      if (hash && getSectionIds().includes(hash)) {
        setTimeout(() => scrollTo(hash), 300)
      }
    })
  })

  onBeforeUnmount(() => {
    if (isListeningScroll) {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateActiveLine)
      isListeningScroll = false
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    sentinelObserver?.disconnect()
    if (scrollLockTimeout) clearTimeout(scrollLockTimeout)
  })

  return {
    activeId,
    isSticky,
    isScrollLocked,
    scrollTo,
  }
}
