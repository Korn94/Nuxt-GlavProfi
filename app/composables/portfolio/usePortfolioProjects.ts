// app/composables/portfolio/usePortfolioProjects.ts
/**
 * 🖼 SSR-загрузчик проектов портфолио для блоков «Наши реализованные проекты»
 * и «Фото до и после» на страницах `/remont-pomescheniy/*`.
 *
 * Почему composable, а не загрузка внутри самих блоков:
 * - блоки `ProjectsShowcase.vue` и `BeforeAfterGallery.vue` монтировали запрос
 *   в `onMounted`, поэтому в SSR-HTML карточек не было вообще (0 ссылок
 *   на `/projects/*` для поисковиков) — здесь загрузка идёт через
 *   `useAsyncData` и попадает в HTML;
 * - данные нужны сразу двум блокам — грузим один раз на страницу;
 * - страница должна знать, есть ли кейсы, ДО рендера: если кейсов нет,
 *   секции и пункты `StickyNav` не выводятся (никаких пустых блоков).
 *
 * Фильтрация выполняется на сервере: `/api/portfolio?categories=Банки,Клиники&limit=3`.
 * Legacy-режим (`slugs`) сохранён без изменений — его используют страницы
 * `/vidy-rabot/*`, там блоки по-прежнему фильтруют по конкретным slug'ам.
 */
import { useAsyncData } from 'nuxt/app'
import type { Project } from '~/components/pages/public/remontPomescheniy/ui/types'

/** Ответ `/api/portfolio` (см. server/api/portfolio/index.get.ts) */
interface PortfolioApiResponse {
  data?: Project[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UsePortfolioProjectsOptions {
  /** Уникальный ключ `useAsyncData`, напр. `premises-projects:banki` */
  key: string
  /**
   * Приоритетный список категорий: [основная, ...смежные].
   * Если массив передан (даже пустой) — включается серверный режим фильтрации.
   * Если не передан вовсе — legacy-режим по `slugs` (как было на `/vidy-rabot/*`).
   */
  categories?: string[]
  /** Сколько карточек вернуть (в серверном режиме) */
  limit?: number
  /** Legacy: фильтрация по конкретным slug'ам проектов */
  slugs?: string[]
  /** URL API */
  fetchUrl?: string
}

export interface PortfolioProjectsResult {
  /** Проекты в порядке приоритета категорий, обрезанные по `limit` */
  projects: Project[]
  /** Сколько карточек относится к основной (первой) категории */
  ownCount: number
  /** Сколько карточек пришло из смежных категорий */
  foreignCount: number
}

/** Значение на случай ошибки/пустого ответа — блок просто не рендерится */
const EMPTY_RESULT: PortfolioProjectsResult = {
  projects: [],
  ownCount: 0,
  foreignCount: 0,
}

/** Достаём массив кейсов из ответа API (поддерживаем оба формата) */
function extractProjects(response: PortfolioApiResponse | Project[]): Project[] {
  const list = Array.isArray(response) ? response : response?.data
  return Array.isArray(list) ? list : []
}

/** Категория кейса из ответа API (поле объявлено в БД, в типе — через индексную сигнатуру) */
function getProjectCategory(project: Project): string {
  return String(project.category ?? '')
}

/** Порядок кейса в портфолио (для стабильной сортировки внутри категории) */
function getProjectOrder(project: Project): number {
  const order = project.order
  return typeof order === 'number' ? order : Number(order) || 0
}

/**
 * Сортировка: сначала карточки основной категории, затем смежных — в порядке
 * приоритетного списка. Внутри категории — по `order` и `id` из БД.
 *
 * Сортировка детерминированная (без `Math.random`), иначе разметка на сервере
 * и клиенте разойдётся и Vue выдаст hydration mismatch.
 */
function sortProjects(projects: Project[], categories: string[]): Project[] {
  const priority = new Map<string, number>()
  categories.forEach((category, index) => priority.set(category, index))

  const fallbackPriority = categories.length

  return [...projects].sort((a, b) => {
    const priorityA = priority.get(getProjectCategory(a)) ?? fallbackPriority
    const priorityB = priority.get(getProjectCategory(b)) ?? fallbackPriority

    if (priorityA !== priorityB) return priorityA - priorityB

    const orderDiff = getProjectOrder(a) - getProjectOrder(b)
    if (orderDiff !== 0) return orderDiff

    return String(a.id ?? '').localeCompare(String(b.id ?? ''), 'ru')
  })
}

/**
 * Загружает проекты портфолио для страницы типа помещения.
 *
 * Вызывать в `<script setup>` страницы: `await usePortfolioProjects({ ... })`.
 * Возвращает уже разрешённые данные (без `Ref`) — странице они нужны
 * для статичной сборки `StickyNav` и `v-if` на секциях.
 */
export async function usePortfolioProjects(
  options: UsePortfolioProjectsOptions,
): Promise<PortfolioProjectsResult> {
  const fetchUrl = options.fetchUrl || '/api/portfolio'
  const limit = options.limit && options.limit > 0 ? options.limit : 0
  const hasCategoryMode = Array.isArray(options.categories)
  const categories = (options.categories || []).filter(
    (category) => typeof category === 'string' && category.trim() !== '',
  )
  const slugs = (options.slugs || []).filter(
    (slug) => typeof slug === 'string' && slug.trim() !== '',
  )

  /**
   * Загрузка данных. Ошибки не пробрасываем: если API недоступен,
   * страница продолжает работать, а блоки просто не рендерятся.
   */
  async function load(): Promise<PortfolioProjectsResult> {
    try {
      // === Режим «по категориям»: фильтр целиком на сервере ===
      if (hasCategoryMode) {
        if (categories.length === 0) return EMPTY_RESULT

        const query: Record<string, string | number> = { categories: categories.join(',') }
        if (limit > 0) query.limit = limit

        const response = await $fetch<PortfolioApiResponse | Project[]>(fetchUrl, { query })
        const sorted = sortProjects(extractProjects(response), categories)
        const projects = limit > 0 ? sorted.slice(0, limit) : sorted

        const ownCount = projects.filter(
          (project) => getProjectCategory(project) === categories[0],
        ).length

        return {
          projects,
          ownCount,
          foreignCount: projects.length - ownCount,
        }
      }

      // === Legacy-режим (/vidy-rabot/*): поведение 1:1 с прежним компонентом ===
      const response = await $fetch<PortfolioApiResponse | Project[]>(fetchUrl)
      const all = extractProjects(response)
      const projects = slugs.length > 0
        ? all.filter((project) => project.slug && slugs.includes(project.slug))
        : all

      return {
        projects,
        ownCount: projects.length,
        foreignCount: 0,
      }
    } catch (err) {
      console.error('[usePortfolioProjects] Не удалось загрузить проекты:', err)
      return EMPTY_RESULT
    }
  }

  const { data } = await useAsyncData<PortfolioProjectsResult>(options.key, load)

  return data.value ?? EMPTY_RESULT
}
