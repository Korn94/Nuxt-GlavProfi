// app/components/pages/public/remontPomescheniy/ui/types.ts
/**
 * ЕДИНЫЙ источник истины для типов переиспользуемых UI-блоков секции
 * «Ремонт помещений» (ui/*).
 *
 * Почему отдельный файл: блоки живут в общем слое `ui/` и используются и
 * `pageTypes/*`, и `workTypes/*`. Раньше те же интерфейсы дублировались
 * внутри `<script setup>` самих компонентов и в `workTypes/types.ts`,
 * наборы полей расходились — и возникали TS2322
 * («Index signature for type 'string' is missing»).
 *
 * Правила:
 * - поля, которые компонент реально рендерит опционально (`v-if` + fallback),
 *   объявляются опциональными;
 * - индексные сигнатуры здесь не нужны: все литералы данных используют только
 *   объявленные поля.
 */

// === PriceFactors (ui/PriceFactors.vue) ===
export interface PriceFactor {
  title: string
  description: string
  /** Иконка: при отсутствии блок рисует fallback `mdi:format-list-numbered` */
  icon?: string
}

// === FAQBlock (ui/FAQBlock.vue) ===
export interface FAQItem {
  question: string
  answer: string
}

// === StickyNav (ui/StickyNav.vue) ===
export interface StickyNavItem {
  id: string
  label: string
  icon?: string
}

// === Breadcrumbs (ui/Breadcrumbs.vue) ===
export interface BreadcrumbItem {
  label: string
  to?: string
}

// === Проекты портфолио (ui/BeforeAfterGallery.vue + pageTypes/ui/ProjectsShowcase.vue) ===
export interface ProjectImage {
  url: string
  /** 'main' | 'before' | 'after' | ... */
  type?: string
  alt?: string
}

/**
 * Проект из `/api/portfolio`. Поля объявлены опциональными, потому что
 * данные приходят из API, а блоки рендерят их через `v-if`.
 * Индексная сигнатура сохраняет tolerated-superficial-compare с произвольным
 * объектом ответа API.
 */
export interface Project {
  id?: number | string
  slug?: string
  title?: string
  subtitle?: string
  /** Площадь, напр. «120» (м²) */
  space?: number | string
  images?: ProjectImage[]
  [key: string]: unknown
}
