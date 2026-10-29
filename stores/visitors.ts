// stores/visitors.ts
/**
 * Store для посетителей публичного сайта (анонимных).
 *
 * Архитектура (по образцу stores/online.ts):
 * - Хранение списка посетителей, полученного из in-memory реестра на сервере
 * - Подписка на real-time обновления через SocketService (событие 'visitors:update')
 * - Данные НЕ пишутся в БД: сервер держит их в памяти (server/utils/visitorRegistry.ts)
 *
 * Аудитория события 'visitors:update' — та же, что у списка онлайна: комната
 * online:viewers (право users:view). См. server/utils/visitor-broadcast.ts.
 */

import { defineStore } from 'pinia'
import { socketService } from 'services/socket.service'
import type { Visitor, VisitorsResponse, VisitorStatsResponse } from '~/types'
import { useApi } from '~/composables/useApi'

/**
 * Интерфейс состояния store
 */
interface VisitorsState {
  /** Список посетителей сайта */
  visitors: Visitor[]
  /** Сводная аналитика из БД (источники, страницы, обращения, визиты) */
  stats: VisitorStatsResponse | null
  /** Период статистики, дней */
  statsDays: number
  /** Флаг загрузки статистики */
  isStatsLoading: boolean
  /** Ошибка загрузки статистики */
  statsError: string | null
  /** Флаг загрузки данных */
  isLoading: boolean
  /** Сообщение об ошибке */
  error: string | null
  /** Флаг активной подписки на сокет-события */
  isSubscribed: boolean
  /** Флаг, были ли данные хотя бы раз загружены */
  isInitialized: boolean
}

/**
 * ✅ Ссылка на текущий socket-обработчик списка посетителей.
 * Нужна, чтобы off(event, handler) снимал ТОЛЬКО свой листенер и не задевал чужие
 * (off(event) без handler удаляет все подписки события).
 */
let visitorsUpdateHandler: ((visitors: Visitor[]) => void) | null = null

export const useVisitorsStore = defineStore('visitors', {
  // ============================================
  // STATE
  // ============================================
  state: (): VisitorsState => ({
    visitors: [],
    stats: null,
    statsDays: 30,
    isStatsLoading: false,
    statsError: null,
    isLoading: false,
    error: null,
    isSubscribed: false,
    isInitialized: false
  }),

  // ============================================
  // GETTERS
  // ============================================
  getters: {
    /** Все посетители */
    getVisitors: (state): Visitor[] => state.visitors,

    /** Общее количество посетителей */
    getVisitorsCount: (state): number => state.visitors.length,

    /** Активные посетители (status: online) */
    getOnlineVisitors: (state): Visitor[] =>
      state.visitors.filter(v => v.status === 'online'),

    /** Посетители на мобильных устройствах */
    getMobileVisitors: (state): Visitor[] =>
      state.visitors.filter(v => v.deviceType === 'mobile'),

    /** Наличие ошибки */
    hasError: (state): boolean => !!state.error
  },

  // ============================================
  // ACTIONS
  // ============================================
  actions: {
    /**
     * Инициализация: загрузка данных + подписка на обновления
     */
    async init() {
      if (this.isInitialized) {
        console.log('[VisitorsStore] ⚠️ Уже инициализирован')
        return
      }
      try {
        await this.fetchVisitors()
        this.subscribeToUpdates()
        this.isInitialized = true
      } catch (error) {
        console.error('[VisitorsStore] ❌ Ошибка инициализации:', error)
      }
    },

    /**
     * Переподписка на обновления (после переподключения сокета)
     */
    resubscribe() {
      if (!this.isInitialized) return
      this.unsubscribeFromUpdates()
      this.subscribeToUpdates()
    },

    /**
     * Загрузка списка посетителей с API
     */
    async fetchVisitors() {
      this.isLoading = true
      this.error = null

      try {
        const api = useApi()
        const response = await api.get<VisitorsResponse>('/api/visitors')

        this.visitors = response.visitors || []
        return this.visitors
      } catch (error: any) {
        console.error('[VisitorsStore] ❌ Ошибка загрузки посетителей:', error)
        this.error = error.data?.message || 'Не удалось загрузить список посетителей'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Загрузка сводной аналитики из БД (таблицы под блоком «Посетители сайта»)
     */
    async fetchStats(days?: number) {
      this.isStatsLoading = true
      this.statsError = null
      if (days) this.statsDays = days

      try {
        const api = useApi()
        this.stats = await api.get<VisitorStatsResponse>(`/api/visitors/stats?days=${this.statsDays}`)
        return this.stats
      } catch (error: any) {
        console.error('[VisitorsStore] ❌ Ошибка загрузки аналитики:', error)
        this.statsError = error.data?.message || error.statusMessage || 'Не удалось загрузить аналитику'
        throw error
      } finally {
        this.isStatsLoading = false
      }
    },

    /**
     * Обновление списка посетителей (вызывается из socket-событий)
     */
    updateVisitors(visitors: Visitor[]) {
      this.$patch({ visitors: [...(visitors || [])] })
    },

    /**
     * Подписка на real-time обновления через SocketService
     */
    subscribeToUpdates() {
      if (this.isSubscribed) {
        console.log('[VisitorsStore] ⚠️ Уже подписано на обновления')
        return
      }

      try {
        visitorsUpdateHandler = (visitors: Visitor[]) => {
          this.updateVisitors(visitors)
        }

        socketService.on('visitors:update', visitorsUpdateHandler)
        this.isSubscribed = true
        console.log('[VisitorsStore] ✅ Подписка на visitors:update активна')
      } catch (error) {
        console.error('[VisitorsStore] ❌ Ошибка подписки на обновления:', error)
        this.error = 'Не удалось подписаться на обновления'
      }
    },

    /**
     * Отписка от real-time обновлений
     */
    unsubscribeFromUpdates() {
      if (!this.isSubscribed) return

      try {
        // ✅ Снимаем ТОЛЬКО свой листенер
        if (visitorsUpdateHandler) {
          socketService.off('visitors:update', visitorsUpdateHandler)
          visitorsUpdateHandler = null
        }
        this.isSubscribed = false
      } catch (error) {
        console.error('[VisitorsStore] ❌ Ошибка отписки от обновлений:', error)
      }
    },

    /**
     * Принудительное обновление (fetch + подписка)
     */
    async refresh() {
      try {
        await this.fetchVisitors()
        this.subscribeToUpdates()
      } catch (error) {
        console.error('[VisitorsStore] ❌ Ошибка обновления данных:', error)
      }
    },

    /**
     * Очистка состояния store
     */
    clear() {
      this.visitors = []
      this.stats = null
      this.statsError = null
      this.error = null
      this.isSubscribed = false
      this.isInitialized = false
      this.unsubscribeFromUpdates()
    }
  }
})
