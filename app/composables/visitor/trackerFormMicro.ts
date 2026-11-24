// app/composables/visitor/trackerFormMicro.ts
/**
 * Микро-трекинг форм: показ в поле зрения → фокус в поле → первый ввод.
 *
 * Зачем: если у формы высокий form_open, но низкий form_submit — непонятно, где
 * именно пользователь застревает. Микро-события дают промежуточные шаги воронки:
 *   form_view  — форма попала в viewport (встроенные формы, Intersection Observer);
 *   form_focus — пользователь поставил курсор в поле ввода;
 *   form_typing — пользователь начал печатать в любом поле.
 *
 * ВАЖНО про form_view: это impression (показ), а не действие пользователя. Чтобы
 * обычное пролистывание страницы не превращалось в «вовлечение», показ засчитывается
 * только если форма продержалась в кадре не меньше minVisibleMs (по умолчанию 1200 мс,
 * env NUXT_PUBLIC_VISITOR_MICRO_VIEW_MIN_MS) и вкладка была видима. Форма, мелькнувшая
 * при быстром скролле, события не даёт.
 *
 * Опциональность (чтобы не спамить событиями все формы):
 * - микро-трекинг подключается ТОЛЬКО там, где его явно вызвали (см. bindFormMicro /
 *   observeFormView) — «opt-in» на уровне разметки;
 * - общий выключатель: runtimeConfig.public.visitorMicroTracking
 *   (env NUXT_PUBLIC_VISITOR_MICRO_TRACKING=false);
 * - опциональный allowlist подписей форм: runtimeConfig.public.visitorMicroSources
 *   (env NUXT_PUBLIC_VISITOR_MICRO_SOURCES="Футер — обратный звонок, ...").
 *
 * Дубли с form_open:
 * - встроенные формы фиксируют form_open на первом focusin внутри формы, поэтому
 *   form_focus для них почти совпадает с form_open (отличие: form_open ловит также
 *   клик по кнопке/чекбоксу формы);
 * - модалки не отправляют form_view: для них «показ формы» == form_open при открытии.
 */

import { useRuntimeConfig } from 'nuxt/app'
import { trackVisitorEvent } from './trackerEvents'

/** Подпись формы: строка или геттер (source может зависеть от props) */
export type FormMicroSource = string | (() => string)

type FormMicroKind = 'view' | 'focus' | 'typing'

const MICRO_EVENT_TYPES: Record<FormMicroKind, 'form_view' | 'form_focus' | 'form_typing'> = {
  view: 'form_view',
  focus: 'form_focus',
  typing: 'form_typing'
}

/** Типы input, фокус/ввод в которые не считается работой с формой */
const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'hidden', 'range', 'color', 'image'
])

/** Уже отправленные микро-события в рамках просмотра страницы: `${path}|${source}|${type}` */
const sentOnPage = new Set<string>()

/** Сколько форма должна пробыть в кадре, чтобы показ считался осознанным (мс) */
export const DEFAULT_VIEW_MIN_MS = 1200

interface MicroConfig {
  enabled: boolean
  /** null — без ограничений по подписи формы */
  sources: Set<string> | null
  /** Минимальное время в кадре для form_view, мс */
  viewMinMs: number
}

let microConfig: MicroConfig | null = null

/** Настройки микро-трекинга из runtimeConfig.public (кэшируются на модуль) */
function getMicroConfig(): MicroConfig {
  if (microConfig) return microConfig

  let enabled = true
  let sources: Set<string> | null = null
  let viewMinMs = DEFAULT_VIEW_MIN_MS

  try {
    const pub = useRuntimeConfig().public as Record<string, unknown>
    if (pub.visitorMicroTracking === false || pub.visitorMicroTracking === 'false') {
      enabled = false
    }
    const raw = pub.visitorMicroSources
    if (typeof raw === 'string' && raw.trim()) {
      sources = new Set(raw.split(',').map(item => item.trim()).filter(Boolean))
    }
    const rawMin = Number(pub.visitorMicroViewMinMs)
    if (Number.isFinite(rawMin) && rawMin >= 0) viewMinMs = rawMin
  } catch {
    // Вне Nuxt-контекста (SSR-хелперы, тесты) — дефолт: включено, без allowlist
  }

  microConfig = { enabled, sources, viewMinMs }
  return microConfig
}

/** Нормализация подписи: как в trackFormOpen (чтобы события сходились по source) */
function normalizeSource(source: FormMicroSource): string {
  const raw = typeof source === 'function' ? source() : source
  return (raw || '').trim() || 'Форма на сайте'
}

/** Включён ли микро-трекинг для этой формы */
export function isFormMicroEnabled(source: FormMicroSource): boolean {
  const config = getMicroConfig()
  if (!config.enabled) return false
  const label = normalizeSource(source)
  return config.sources ? config.sources.has(label) : true
}

/** Отправленное микро-событие: page-scope дедуплицируется в рамках страницы */
function sendMicro(kind: FormMicroKind, source: FormMicroSource, pageScoped: boolean): void {
  if (typeof window === 'undefined') return

  const label = normalizeSource(source)
  if (!isFormMicroEnabled(label)) return

  if (pageScoped) {
    const key = `${window.location.pathname}|${label}|${kind}`
    if (sentOnPage.has(key)) return
    sentOnPage.add(key)
  }

  trackVisitorEvent(MICRO_EVENT_TYPES[kind], { source: label })
}

// ============================================
// Пользовательский жест: отсекаем программный focus()
// ============================================

/** Время последнего осознанного действия пользователя (клик/тап/клавиша) */
let lastGestureAt = 0
let gestureTrackingReady = false

/** Окно, в котором focusin считаем следствием действия пользователя */
const GESTURE_WINDOW_MS = 1500

function markGesture(): void {
  lastGestureAt = Date.now()
}

function ensureGestureTracking(): void {
  if (gestureTrackingReady || typeof window === 'undefined') return
  gestureTrackingReady = true
  const options: AddEventListenerOptions = { passive: true, capture: true }
  window.addEventListener('pointerdown', markGesture, options)
  window.addEventListener('touchstart', markGesture, options)
  window.addEventListener('keydown', markGesture, options)
}

/**
 * Был ли недавний жест пользователя. Нужен, чтобы автофокус первого поля при
 * открытии модалки (element.focus() из кода) не считался фокусом пользователя.
 */
function hasRecentGesture(): boolean {
  return lastGestureAt > 0 && Date.now() - lastGestureAt < GESTURE_WINDOW_MS
}

/** Поле ввода, с которым работает пользователь (input/textarea/select) */
function isTextField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  const type = ((target as HTMLInputElement).type || 'text').toLowerCase()
  return !NON_TEXT_INPUT_TYPES.has(type)
}

// ============================================
// ПУБЛИЧНОЕ API: разовые события
// ============================================

/** Показ формы (встроенные формы): один раз за просмотр страницы */
export function trackFormView(source: FormMicroSource): void {
  sendMicro('view', source, true)
}

/** Первый фокус на поле формы: один раз за просмотр страницы */
export function trackFormFocus(source: FormMicroSource): void {
  sendMicro('focus', source, true)
}

/** Первый ввод в поле формы: один раз за просмотр страницы */
export function trackFormTyping(source: FormMicroSource): void {
  sendMicro('typing', source, true)
}

// ============================================
// ХЕЛПЕРЫ ДЛЯ КОМПОНЕНТОВ
// ============================================

/**
 * Наблюдать за появлением встроенной формы в viewport (Intersection Observer).
 * Показ (form_view) отправляется один раз за просмотр страницы и только если форма
 * продержалась в кадре minVisibleMs при видимой вкладке — быстрый скролл мимо формы
 * событие не создаёт.
 *
 * @param el     Корневой элемент формы
 * @param source Подпись формы (= source у form_open / form_submit)
 * @param opts.threshold    Доля видимости формы, при которой считаем «увидел» (по умолчанию 0.4)
 * @param opts.minVisibleMs Сколько мс форма должна быть в кадре (по умолчанию из
 *                          runtimeConfig.public.visitorMicroViewMinMs, 1200 мс)
 * @returns функция отписки (вызвать в onBeforeUnmount)
 */
export function observeFormView(
  el: Element | null | undefined,
  source: FormMicroSource,
  opts: { threshold?: number; minVisibleMs?: number } = {}
): () => void {
  if (typeof window === 'undefined' || !el) return () => {}
  if (!isFormMicroEnabled(source)) return () => {}

  // Старые браузеры без Intersection Observer: считаем, что форма видна
  if (typeof IntersectionObserver === 'undefined') {
    trackFormView(source)
    return () => {}
  }

  const minVisibleMs = opts.minVisibleMs ?? getMicroConfig().viewMinMs
  let timer: ReturnType<typeof setTimeout> | null = null
  let inView = false
  let finished = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const cleanup = () => {
    clearTimer()
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  /** Показ состоялся: отправляем form_view и снимаем наблюдение */
  const fire = () => {
    if (finished) return
    finished = true
    trackFormView(source)
    cleanup()
  }

  /** Форма в кадре и вкладка видима — запускаем паузу (или отправляем сразу при 0) */
  const maybeStart = () => {
    if (finished || !inView || timer) return
    if (document.visibilityState !== 'visible') return

    if (minVisibleMs <= 0) {
      fire()
      return
    }

    timer = setTimeout(() => {
      timer = null
      if (document.visibilityState !== 'visible') return
      fire()
    }, minVisibleMs)
  }

  /** Вкладка вернулась в фокус: если форма на экране — отсчёт начинается заново */
  function onVisibilityChange() {
    if (document.visibilityState !== 'visible') {
      clearTimer()
      return
    }
    maybeStart()
  }

  const observer = new IntersectionObserver((entries) => {
    inView = entries.some(entry => entry.isIntersecting)
    // Ушла из кадра — показ не состоялся (обычный скролл мимо формы)
    if (!inView) {
      clearTimer()
      return
    }
    maybeStart()
  }, { threshold: opts.threshold ?? 0.4 })

  document.addEventListener('visibilitychange', onVisibilityChange)
  observer.observe(el)

  return cleanup
}

export interface FormMicroOptions {
  /**
   * Область дедупликации:
   * - 'page'     — один раз за просмотр страницы (встроенные формы; по умолчанию);
   * - 'instance' — один раз на жизнь компонента (модалки: каждое открытие — новый цикл).
   */
  scope?: 'page' | 'instance'
}

export interface FormMicroBindings {
  /** Первый фокус на поле (вешать на @focusin формы) */
  onFocusIn: (event?: Event) => void
  /** Первый ввод в поле (вешать на @input формы) */
  onInput: (event?: Event) => void
  /**
   * Сбросить дедупликацию instance-области (новое открытие модалки без размонтирования).
   * Для scope 'page' ничего не делает — там дедупликация привязана к странице.
   */
  reset: () => void
}

/**
 * Обработчики микро-событий формы: первый фокус на поле и первый ввод.
 *
 * Пример (модалка):
 *   const micro = bindFormMicro(() => props.sourceLabel, { scope: 'instance' })
 *   <form @focusin="micro.onFocusIn" @input="micro.onInput">
 *
 * Пример (встроенная форма):
 *   const micro = bindFormMicro(SOURCE)
 *   <form ref="formEl" @focusin="handleFocusIn" @input="micro.onInput">
 *   // handleFocusIn вызывает и onFormInteraction (form_open), и micro.onFocusIn(event)
 */
export function bindFormMicro(
  source: FormMicroSource,
  opts: FormMicroOptions = {}
): FormMicroBindings {
  const scope = opts.scope || 'page'
  const sentInInstance = new Set<FormMicroKind>()

  const emit = (kind: FormMicroKind): void => {
    if (!isFormMicroEnabled(source)) return
    if (scope === 'instance') {
      if (sentInInstance.has(kind)) return
      sentInInstance.add(kind)
      sendMicro(kind, source, false)
      return
    }
    sendMicro(kind, source, true)
  }

  // Слушаем жесты сразу при биндинге: иначе первый pointerdown (перед focusin)
  // не будет учтён и первый же фокус на поле отбросится как «программный».
  ensureGestureTracking()

  return {
    onFocusIn: (event?: Event) => {
      if (event && !isTextField(event.target)) return
      // Фокус без предшествующего жеста = автофокус из кода — не считаем
      if (!hasRecentGesture()) return
      emit('focus')
    },
    onInput: (event?: Event) => {
      if (event && !isTextField(event.target)) return
      emit('typing')
    },
    reset: () => {
      sentInInstance.clear()
    }
  }
}
