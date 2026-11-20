// app/composables/useExtraLinks.ts
/**
 * 🗂 Конфигурация страницы «Дополнительно» (/cabinet/more).
 *
 * Здесь собраны «служебные» ссылки, которые занимали место в боковом меню:
 * партнёры (список, кабинет и публичный оффер), кейсы, реквизиты,
 * коммерческие предложения и тестовые страницы.
 * Каждая ссылка сама решает, видна ли она (visible), группы фильтруются по
 * правам — поэтому страницу можно открывать любому сотруднику, лишних ссылок
 * он не увидит.
 *
 * Список КП приходит из useOfferLinks() — новые страницы /offers/* попадают
 * сюда автоматически.
 */
import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'
import { useOfferLinks } from '~/composables/useOfferLinks'

export interface ExtraLink {
  id: string
  title: string
  description?: string
  path: string
  icon: string
  /** '_blank' — открывать в новой вкладке */
  target?: '_blank'
}

/** Ссылка + правило видимости (правило в UI не рендерится) */
export interface ExtraLinkDef extends ExtraLink {
  visible: () => boolean
}

export interface ExtraLinkGroup {
  id: string
  title: string
  icon: string
  links: ExtraLinkDef[]
}

export function useExtraLinks() {
  const { can, hasRole } = usePermissions()
  const { offers } = useOfferLinks()

  const groups = computed<ExtraLinkGroup[]>(() => {
    const isAdmin = hasRole('admin')

    const allGroups: ExtraLinkGroup[] = [
      // ── Партнёры ──────────────────────────────────────────────────
      {
        id: 'partners',
        title: 'Партнёры',
        icon: 'mdi:handshake-outline',
        links: [
          {
            id: 'partners-list',
            title: 'Партнёры',
            description: 'Список партнёров, сделки и этапы',
            path: '/cabinet/partners',
            icon: 'mdi:handshake-outline',
            visible: () => can('partners', 'view'),
          },
          {
            id: 'partner-cabinet',
            title: 'Кабинет партнёра',
            description: 'Партнёрский кабинет (светлая тема)',
            path: '/cabinet/partner',
            icon: 'mdi:account-tie-outline',
            visible: () => isAdmin || hasRole('partner'),
          },
          {
            id: 'partner-offer',
            title: 'Партнёрам',
            description: 'Оффер для партнёров: условия и калькулятор вознаграждения',
            path: '/partner',
            icon: 'mdi:bullhorn-outline',
            target: '_blank',
            // Публичный лендинг (layout empy, noindex) — открываем в новой вкладке
            visible: () => true,
          },
        ],
      },

      // ── Кейсы ─────────────────────────────────────────────────────
      {
        id: 'cases',
        title: 'Кейсы',
        icon: 'mdi:briefcase-outline',
        links: [
          {
            id: 'portfolio',
            title: 'Кейсы',
            description: 'Портфолио на сайте: список, создание, редактирование',
            path: '/cabinet/portfolio',
            icon: 'mdi:briefcase-outline',
            visible: () => can('portfolio', 'view'),
          },
        ],
      },

      // ── Коммерческие предложения (авто-список) ─────────────────────
      {
        id: 'offers',
        title: 'Коммерческие предложения',
        icon: 'mdi:file-document-outline',
        links: offers.map(offer => ({
          id: `offer-${offer.slug}`,
          title: offer.title,
          // В строке списка достаточно адреса объекта и даты:
          // номер КП и путь ссылки — лишний шум
          description: [offer.object, offer.date].filter(Boolean).join(' · '),
          path: offer.path,
          icon: 'mdi:file-document-outline',
          target: '_blank',
          visible: () => isAdmin,
        })),
      },

      // ── Реквизиты ─────────────────────────────────────────────────
      {
        id: 'requisites',
        title: 'Реквизиты',
        icon: 'mdi:file-document-outline',
        links: [
          {
            id: 'requisites-llc',
            title: 'Реквизиты ООО',
            description: 'Публичная страница реквизитов ООО',
            path: '/requisites',
            icon: 'mdi:domain',
            target: '_blank',
            visible: () => isAdmin,
          },
          {
            id: 'requisites-ip',
            title: 'Реквизиты ИП',
            description: 'Публичная страница реквизитов ИП',
            path: '/requisites-ip',
            icon: 'mdi:account-tie-outline',
            target: '_blank',
            visible: () => isAdmin,
          },
        ],
      },

      // ── Тесты ─────────────────────────────────────────────────────
      {
        id: 'tests',
        title: 'Тесты',
        icon: 'mdi:flask-outline',
        links: [
          {
            id: 'test2',
            title: 'Тест2',
            description: 'DaData + риэлторы РГР',
            path: '/cabinet/testpage2',
            icon: 'mdi:flask-outline',
            visible: () => isAdmin && can('test', 'view'),
          },
        ],
      },
    ]

    return allGroups
      .map(group => ({ ...group, links: group.links.filter(link => link.visible()) }))
      .filter(group => group.links.length > 0)
  })

  /** Есть ли хоть одна доступная ссылка (для проверки видимости пункта меню) */
  const hasVisibleLinks = computed(() => groups.value.length > 0)

  return { groups, hasVisibleLinks }
}
