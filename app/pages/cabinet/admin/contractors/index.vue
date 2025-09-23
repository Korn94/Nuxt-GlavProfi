<!-- app/components/pages/cabinet/workers/index.vue -->
<template>
  <PagesCabinetUiLayoutPageTitle title="Контрагенты" >
    <template #actions>
      <button class="btn btn-primary">
        <Icon name="mdi:plus" size="16" />
        Новый
      </button>
    </template>
  </PagesCabinetUiLayoutPageTitle>
  
  <!-- Главная страница внутри LayoutCabinetHeaderWorkersMenu -->
  <div class="cabinet-page">
    <Card title="Категории контрагентов" elevated>
      <template #icon>
        <Icon name="mdi:account-group" size="24" />
      </template>

      <!-- Список категорий -->
      <div v-if="contractors.length > 0" class="categories-content">
        <ul class="categories-list">
          <li
            v-for="category in categories"
            :key="category.type"
            class="category-item"
          >
            <NuxtLink
              :to="`/cabinet/admin/contractors/${category.path}`"
              class="category-link"
            >
              <span class="label">{{ category.title }}</span>
              <span class="count">{{ category.count }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="empty-state">
        <Icon name="ic:outline-people-alt" size="40" />
        <p>Нет доступных контрагентов</p>
      </div>

      <!-- Футер: общее количество -->
      <template #footer>
        Всего контрагентов: {{ contractors.length }}
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Подключаем карточку
const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние
const contractors = ref([])

// Маппинг типа → путь и отображаемое название (соответствует tabs в layout)
const categoryMap = {
  master: { path: 'master', title: 'Мастера' },
  worker: { path: 'worker', title: 'Разнорабочие' },
  foreman: { path: 'foreman', title: 'Прорабы' },
  office: { path: 'office', title: 'Офис' }
}

// Вычисляем категории для отображения
const categories = computed(() =>
  Object.values(categoryMap).map(cat => ({
    ...cat,
    count: contractors.value.filter(c => c.type === cat.path).length
  }))
)

// Загрузка списка контрагентов
async function fetchContractors() {
  try {
    const res = await $fetch('/api/contractors', {
      method: 'GET',
      credentials: 'include'
    })
    contractors.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('Ошибка при загрузке контрагентов:', err)
    contractors.value = []
  }
}

onMounted(fetchContractors)

definePageMeta({ 
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})
</script>

<style lang="scss" scoped>
.contractors-home {
  width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.categories-content {
  width: 100%;
}

.categories-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.category-item {
  border-radius: 8px;
  overflow: hidden;
}

.category-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #495057;
  text-decoration: none;
  transition: all 0.2s ease;

  .label {
    font-weight: 500;
    color: #212529;
  }

  .count {
    font-weight: bold;
    color: #2c5f91;
    min-width: 36px;
    text-align: right;
  }

  &:hover {
    background-color: #eef2f7;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6c757d;

  svg {
    opacity: 0.6;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
  }
}
</style>