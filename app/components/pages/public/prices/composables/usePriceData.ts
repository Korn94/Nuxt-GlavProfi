// app/components/pages/public/prices/composables/usePriceData.ts
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData, createError } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'

// Базовый интерфейс для всех элементов прайса
export interface PriceItemBase {
  id: number
  unit: string
  price: number | string
  isCopied: boolean
  type: 'item' | 'detail' | 'dopwork'
}

// Основная работа
export interface PriceWorkItem extends PriceItemBase {
  name: string
  type: 'item'
  details: PriceDetailItem[]
  dopworks: PriceDopworkItem[]
}

// Деталь работы
export interface PriceDetailItem extends PriceItemBase {
  name: string
  type: 'detail'
}

// Доп. работа
export interface PriceDopworkItem extends PriceItemBase {
  label: string
  dopwork: string
  type: 'dopwork'
}

// Общий тип для любого элемента
export type PriceItem = PriceWorkItem | PriceDetailItem | PriceDopworkItem

export interface PriceSubcategory {
  id: number
  name: string
  items: PriceWorkItem[]
}

export interface PriceCategory {
  id: number
  title: string
  subcategories: PriceSubcategory[]
}

// Интерфейс для ответа API
interface ApiMeResponse {
  user?: {
    role?: string
  }
}

interface ApiPriceResponse {
  categories?: Array<{
    id: number
    name: string
    subcategories?: Array<{
      id: number
      name: string
      items?: Array<{
        id: number
        name: string
        unit: string
        price: number | string
        details?: Array<{
          id: number
          name: string
          unit: string
          price: number | string
        }>
        dopworks?: Array<{
          id: number
          label: string
          dopwork: string
          unit: string
          price: number | string
        }>
      }>
    }>
  }>
}

export async function usePriceData() {
  const route = useRoute()
  const authStore = useAuthStore()

  const works = ref<PriceCategory[]>([])
  const isAdmin = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const { data: pageData, refresh, error } = await useAsyncData(
    `price-${route.params.category}`,
    async () => {
      isLoading.value = true
      errorMessage.value = ''

      const headers: Record<string, string> = {}
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`
      }

      // Проверка роли
      let isAdminUser = false
      if (authStore.token) {
        try {
          const me = await $fetch<ApiMeResponse>('/api/me', { headers })
          const userRole = me?.user?.role
          isAdminUser = userRole === 'admin' || userRole === 'manager'
        } catch (err) {
          console.error('Ошибка проверки роли:', err)
        }
      }

      // Загрузка прайса по категории
      let priceData: ApiPriceResponse | null = null
      try {
        priceData = await $fetch<ApiPriceResponse>(`/api/price/list/${route.params.category}`, {
          headers
        })
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        errorMessage.value = 'Ошибка загрузки данных'
      }

      // Очистка данных для сериализации
      const cleanPriceData = priceData ? JSON.parse(JSON.stringify(priceData)) : null

      isLoading.value = false

      return {
        priceData: cleanPriceData,
        isAdminUser
      }
    },
    {
      server: true,
      lazy: false,
      default: () => ({
        priceData: null,
        isAdminUser: false
      })
      // onResponseError убран — его нет в useAsyncData, только в useFetch/$fetch
    }
  )

  // Обработка ошибки загрузки
  if (error.value || !pageData.value?.priceData) {
    throw createError({ statusCode: 404, statusMessage: 'Страница прайса не найдена' })
  }

  const { priceData, isAdminUser } = pageData.value
  isAdmin.value = isAdminUser

  // Трансформация данных в удобную структуру
  const transformPriceData = (data: ApiPriceResponse | null): PriceCategory[] => {
    if (!data?.categories) return []

    return data.categories.map((category): PriceCategory => ({
      id: category.id,
      title: category.name,
      subcategories: (category.subcategories || []).map((subcategory): PriceSubcategory => ({
        id: subcategory.id,
        name: subcategory.name,
        items: (subcategory.items || []).map((item): PriceWorkItem => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          price: item.price,
          isCopied: false,
          type: 'item',
          details: (item.details || []).map((detail): PriceDetailItem => ({
            id: detail.id,
            name: detail.name,
            unit: item.unit, // детали наследуют unit от работы
            price: detail.price,
            isCopied: false,
            type: 'detail'
          })),
          dopworks: (item.dopworks || []).map((dopworkGroup): PriceDopworkItem => ({
            id: dopworkGroup.id,
            label: dopworkGroup.label,
            dopwork: dopworkGroup.dopwork,
            unit: dopworkGroup.unit,
            price: dopworkGroup.price,
            isCopied: false,
            type: 'dopwork'
          }))
        }))
      }))
    }))
  }

  works.value = transformPriceData(priceData)

  watch(pageData, () => {
    if (pageData.value?.priceData) {
      works.value = transformPriceData(pageData.value.priceData)
    }
  })

  return {
    works,
    isAdmin,
    isLoading,
    errorMessage,
    refresh,
    pageData
  }
}