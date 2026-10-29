// app/components/pages/Cabinet/Online/composables/useOnlineFormatters.ts
import { ref } from 'vue'

/**
 * Разделяемый «тикер» текущего времени.
 * Один экземпляр на страницу «Онлайн»: все подкомпоненты видят единое
 * актуальное время для относительных подписей («N мин назад», «Nч Nм»).
 */
const currentTime = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval> | null = null

function startClock() {
  if (clockTimer) return
  clockTimer = setInterval(() => { currentTime.value = Date.now() }, 1000)
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
}

const AFK_THRESHOLD = 5 * 60 * 1000

const roleLabels: Record<string, string> = {
  admin: 'Админ', manager: 'Менеджер', foreman: 'Прораб',
  master: 'Мастер', worker: 'Рабочий',
}

const statusLabels: Record<string, string> = {
  online: 'онлайн',
  afk: 'afk',
  offline: 'вышел',
}

const deviceLabels: Record<string, string> = {
  desktop: 'Компьютер',
  mobile: 'Мобильное устройство',
  tablet: 'Планшет',
  unknown: 'Неизвестное устройство',
}

const eventLabels: Record<string, string> = {
  click_phone: 'Клик по телефону',
  copy_phone: 'Копирование телефона',
  click_messenger: 'Мессенджер',
  click_email: 'Email',
  form_open: 'Открытие формы',
  form_submit: 'Отправка формы',
  cta_click: 'Клик по CTA',
}

function eventLabel(type: string): string {
  return eventLabels[type] || type
}

/** 125 → «2м 5с» */
function formatSeconds(sec: number | null | undefined): string {
  const s = Math.max(0, Math.round(sec || 0))
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}м ${s % 60}с` : `${Math.floor(m / 60)}ч ${m % 60}м`
}

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'не заходил'
  const diff = currentTime.value - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (s < 60) return 'только что'
  if (m < 60) return `${m} мин назад`
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}

function formatFullDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'

  const date = new Date(dateStr)

  // Проверяем валидность даты
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDuration(startedAt: string): string {
  if (!startedAt) return '—'
  const diff = currentTime.value - new Date(startedAt).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

function isActivityStale(lastActivity: string): boolean {
  if (!lastActivity) return true
  return currentTime.value - new Date(lastActivity).getTime() > AFK_THRESHOLD
}

/**
 * Убирает query-строку и ведущие слэши из пути страницы.
 * Пример: '/cabinet/objects/30?tab=budget' → 'cabinet/objects/30'
 */
function cleanPath(path: string | null | undefined): string {
  const base = (path || '').split('?')[0] ?? ''
  return base.split('/').filter(Boolean).join('/')
}

function formatPath(path: string | null | undefined, objectName?: string | null): string {
  if (!path || path === 'null') return '—'
  const clean = cleanPath(path)
  // ✅ '/' — это главная публичного сайта: трекинг активности глобальный
  // (app/composables/useActivityTracker.ts монтируется в app/app.vue),
  // поэтому авторизованный пользователь может находиться и на публичных страницах.
  if (!clean) return 'Главная (сайт)'

  // 🏗️ Карточка объекта: показываем НАЗВАНИЕ объекта, а не /cabinet/objects/30
  if (clean.startsWith('cabinet/objects/')) {
    const objectId = clean.slice('cabinet/objects/'.length).split('/')[0]
    return objectName ? `Объекты → ${objectName}` : `Объект #${objectId}`
  }

  const labels: Record<string, string> = {
    // Кабинет
    'cabinet': 'Кабинет', 'cabinet/dashboard': 'Главная',
    'cabinet/online': 'Онлайн', 'cabinet/boards': 'Доски',
    'cabinet/objects': 'Объекты', 'cabinet/operation': 'Операции',
    'cabinet/materials': 'Материалы', 'cabinet/works': 'Работы',
    'cabinet/daily-work': 'Подневка', 'cabinet/contractors': 'Сотрудники',
    'cabinet/contractors/users': 'Сотрудники → Пользователи',
    'cabinet/portfolio': 'Кейсы', 'cabinet/price': 'Прайс-лист',
    'cabinet/settings/permissions': 'Настройки → Права доступа',
    'login': 'Вход',
    // Публичная часть сайта
    'about': 'О компании', 'contacts': 'Контакты', 'projects': 'Проекты',
    'prices': 'Цены', 'partner': 'Партнёрам', 'telegram': 'Telegram',
    'remont-pomescheniy': 'Ремонт помещений', 'vidy-rabot': 'Виды работ',
    'privacy-policy': 'Политика', 'terms-of-service': 'Условия',
    'access-denied': 'Доступ запрещён',
  }
  if (labels[clean]) return labels[clean]
  const parts = clean.split('/')
  const page = parts[1]
  if (page) return page.charAt(0).toUpperCase() + page.slice(1)
  return clean.length > 25 ? clean.substring(0, 22) + '…' : clean
}

function getPageIcon(path: string | null | undefined): string {
  if (!path) return 'mdi:web'
  const clean = cleanPath(path)
  // ✅ '/' — главная публичного сайта (трекинг активности глобальный, app/app.vue)
  if (!clean) return 'mdi:home-city'

  // 🏗️ Карточки объектов и сотрудников
  if (clean.startsWith('cabinet/objects/')) return 'mdi:office-building-outline'
  if (clean.startsWith('cabinet/contractors/')) return 'mdi:account-hard-hat'

  const icons: Record<string, string> = {
    'cabinet/dashboard': 'mdi:view-dashboard-outline',
    'cabinet/online': 'mdi:account-group', 'cabinet/boards': 'mdi:view-dashboard',
    'cabinet/objects': 'mdi:office-building-outline', 'cabinet/operation': 'mdi:swap-horizontal',
    'cabinet/materials': 'mdi:receipt-text-outline', 'cabinet/works': 'mdi:hammer-wrench',
    'cabinet/daily-work': 'mdi:calendar-check-outline', 'cabinet/contractors': 'mdi:account-group-outline',
    'cabinet/portfolio': 'mdi:folder-image', 'cabinet/price': 'mdi:currency-rub',
    'cabinet/settings/permissions': 'mdi:shield-account-outline', 'login': 'mdi:login',
    // Публичная часть сайта
    'about': 'mdi:information-outline', 'contacts': 'mdi:phone-outline',
    'projects': 'mdi:briefcase-outline', 'prices': 'mdi:currency-rub',
    'partner': 'mdi:handshake', 'telegram': 'mdi:send',
    'remont-pomescheniy': 'mdi:office-building', 'vidy-rabot': 'mdi:hammer-screwdriver',
  }
  return icons[clean] || 'mdi:web'
}

function formatIp(ip: string | null | undefined): string {
  if (!ip) return '—'
  const parts = ip.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : ip
}

export function useOnlineFormatters() {
  return {
    startClock,
    stopClock,
    roleLabels,
    statusLabels,
    deviceLabels,
    eventLabel,
    formatSeconds,
    formatTimeAgo,
    formatFullDateTime,
    getDuration,
    isActivityStale,
    cleanPath,
    formatPath,
    getPageIcon,
    formatIp,
  }
}
