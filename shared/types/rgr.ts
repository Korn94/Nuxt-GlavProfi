// shared/types/rgr.ts
/**
 * 📞 Типы для блока парсинга Единого реестра РГР (reestr.rgr.ru).
 *
 * Используется:
 * - Сервер: server/utils/rgrRealtors.ts, server/api/rgr/*
 * - Клиент: app/components/pages/Cabinet/test/RgrRealtors/index.vue
 *
 * ⚠️ Единый источник истины для контракта API /api/rgr/* — менять только здесь.
 */

/** Агентство недвижимости из карточки риелтора. */
export interface RgrRealtorAgency {
  name: string | null
  url: string | null
}

/** Карточка аттестованного специалиста из листинга города (без телефона). */
export interface RgrRealtor {
  /** Индекс внутри страницы листинга (0-based) — используется в ?indices= */
  index: number
  /** ФИО специалиста */
  name: string
  /** Должность/квалификация, например «Ведущий эксперт отдела жилой недвижимости» */
  position: string | null
  agency: RgrRealtorAgency
  /** Адрес из карточки (регион, город, улица) */
  address: string | null
  /** Рейтинг специалиста (звёзды) */
  rating: number | null
  /** Номер аттестата, например «Аттестат №РОСС RU РГР ТОС 62 БН 0517» */
  attestat: string | null
  /** Срок действия аттестата, например «07.10.2028» */
  attestatUntil: string | null
  /** Абсолютная ссылка на фото */
  photo: string | null
  /** Абсолютная ссылка на персональную страницу специалиста */
  url: string
}

/** Ответ GET /api/rgr/realtors */
export interface RgrRealtorsResponse {
  page: number
  totalPages: number
  /** «В городе: N специалистов» со страницы листинга */
  totalSpecialists: number
  /** Источник данных (страница города в РГР) */
  sourceUrl: string
  /** Момент парсинга (ISO) */
  fetchedAt: string
  /** true — данные отданы из короткого серверного кэша */
  cached: boolean
  items: RgrRealtor[]
}

/** Телефон одного специалиста (результат парсинга персональной страницы). */
export interface RgrPhoneItem {
  /** Индекс внутри страницы листинга (0-based) */
  index: number
  /** Ссылка на персональную страницу */
  url: string
  /** ФИО (для удобства клиента) */
  name: string
  /** Нормализованный номер «+7 (920) 963-77-77» или null, если у специалиста номера нет */
  phone: string | null
  /** Номер в виде 11 цифр «79209637777» (для tel: и копирования) или null */
  digits: string | null
  /** Текст ошибки по конкретной карточке (номер может отсутствовать — это не ошибка) */
  error: string | null
}

/** Ответ GET /api/rgr/phones */
export interface RgrPhonesResponse {
  page: number
  sourceUrl: string
  /** Момент парсинга (ISO) */
  fetchedAt: string
  /** Сколько карточек обработано */
  requested: number
  /** Сколько номеров найдено */
  found: number
  items: RgrPhoneItem[]
}
