<!-- app/components/pages/cabinet/Portfolio/index.vue -->
<template>
  <div class="portfolio-page">

    <!-- Заголовок с кнопкой добавления -->
    <PagesCabinetUiLayoutPageTitle title="Кейсы" icon="mdi:briefcase-outline">
      <template #actions>
        <NuxtLink 
          to="/cabinet/portfolio/create" 
          class="crm-btn crm-btn--accent"
        >
          <Icon name="mdi:plus" size="15" />
          Добавить кейс
        </NuxtLink>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="portfolio-page__content">

      <!-- Вкладки по категориям + счётчик -->
      <div class="portfolio-nav">
        <div class="tabs">
          <button 
            v-for="tab in availableTabs" 
            :key="tab" 
            class="tab" 
            :class="{ 'tab--active': activeTab === tab }"
            @click="setActiveTab(tab)"
          >
            {{ tab }}
            <span v-if="categoryCounts[tab]" class="tab__count">
              {{ categoryCounts[tab] }}
            </span>
          </button>
        </div>

        <div class="search-box">
          <Icon name="mdi:magnify" size="14" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Поиск по названию..." 
            class="search-input"
          />
        </div>
      </div>

      <!-- Список кейсов -->
      <div class="portfolio-card">

        <!-- Скелетон при загрузке -->
        <div v-if="loading" class="portfolio-skeleton">
          <div v-for="i in 5" :key="i" class="skel" />
        </div>

        <!-- Пустое состояние -->
        <div v-else-if="!filteredCases.length" class="portfolio-empty">
          <Icon name="mdi:briefcase-outline" size="36" />
          <span>Нет кейсов в категории «{{ activeTab }}»</span>
          <NuxtLink to="/cabinet/portfolio/create" class="crm-btn crm-btn--accent">
            Создать первый кейс
          </NuxtLink>
        </div>

        <!-- Список -->
        <ul v-else class="case-list">
          <li 
            v-for="(caseItem, idx) in filteredCases" 
            :key="caseItem.id" 
            class="case-list__item"
            :class="{ 'case-list__item--alt': idx % 2 === 1 }"
          >
            <div class="case-item">

              <!-- Левая часть: информация -->
              <div class="case-item__info">
                <div class="case-item__header">
                  <span class="case-item__title">{{ caseItem.title }}</span>
                  <span class="case-item__category">{{ caseItem.category }}</span>
                </div>

                <div class="case-item__meta">
                  <span>
                    <Icon name="mdi:arrow-expand-all" size="12" />
                    {{ caseItem.space }} м²
                  </span>
                  <span>
                    <Icon name="mdi:clock-outline" size="12" />
                    {{ caseItem.duration }}
                  </span>
                  <span>
                    <Icon name="mdi:account-group-outline" size="12" />
                    {{ caseItem.people }}
                  </span>
                </div>

                <div class="case-item__slug">
                  <Icon name="mdi:link-variant" size="12" />
                  <span>/projects/{{ caseItem.slug }}</span>
                </div>
              </div>

              <!-- Правая часть: статус и действия -->
              <div class="case-item__actions">

                <!-- Переключатель публикации -->
                <button 
                  class="publish-toggle" 
                  :class="{ 'publish-toggle--on': caseItem.isPublished }"
                  @click="togglePublish(caseItem)"
                  :title="caseItem.isPublished ? 'Опубликован' : 'Скрыт'"
                >
                  <span class="toggle-dot" />
                </button>

                <!-- Кнопки действий -->
                <div class="action-buttons">
                  <NuxtLink 
                    :to="`/cabinet/portfolio/${caseItem.slug}/edit`" 
                    class="action-btn action-btn--edit"
                    title="Редактировать"
                  >
                    <Icon name="mdi:pencil-outline" size="16" />
                  </NuxtLink>
                  <button 
                    class="action-btn action-btn--delete"
                    @click="confirmDelete(caseItem)"
                    title="Удалить"
                  >
                    <Icon name="mdi:trash-can-outline" size="16" />
                  </button>
                </div>

              </div>

            </div>
          </li>
        </ul>

        <!-- Футер со счётчиком -->
        <div class="portfolio-card__footer">
          Всего: {{ filteredCases.length }} кейс(а)
        </div>

      </div>

    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3>Удалить кейс?</h3>
        <p>«{{ caseToDelete?.title }}» будет удалён без возможности восстановления.</p>
        <div class="modal-actions">
          <button class="crm-btn" @click="showDeleteModal = false">Отмена</button>
          <button class="crm-btn crm-btn--danger" @click="deleteCase" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin', 'manager'],
})

// ── Состояние ─────────────────────────────────────────────────────
const loading = ref(true)
const deleting = ref(false)
const cases = ref<any[]>([])
const activeTab = ref('Все')
const searchQuery = ref('')

// Модальное окно удаления
const showDeleteModal = ref(false)
const caseToDelete = ref<any>(null)

// Все возможные категории (как в публичной части)
const allCategories = [
  'Все',
  'Кафе',
  'Магазины',
  'Клиники',
  'Банки',
  'Фитнес',
  'Производственные',
  'Фасады и Кровля',
  'Прочее'
]

// ── Вычисляемые свойства ──────────────────────────────────────────
// Счётчики по категориям
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  cases.value.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1
  })
  return counts
})

// Доступные вкладки (только те, где есть кейсы + "Все")
const availableTabs = computed(() => {
  return allCategories.filter(cat => {
    if (cat === 'Все') return true
    return (categoryCounts.value[cat] ?? 0) > 0
  })
})

// Фильтрация: категория + поиск
const filteredCases = computed(() => {
  let list = cases.value
  
  // Фильтр по категории
  if (activeTab.value !== 'Все') {
    list = list.filter(c => c.category === activeTab.value)
  }
  
  // Поиск по названию
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.slug.toLowerCase().includes(query)
    )
  }
  
  // Сортировка: сначала новые
  return [...list].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
})

// ── API ───────────────────────────────────────────────────────────
// Загрузка списка кейсов
const fetchCases = async () => {
  loading.value = true
  try {
    // ✅ Исправлена типизация ответа
    const response = await $fetch<{ data: any[] }>('/api/portfolio', {
      params: { limit: 100, page: 1 }
    })
    cases.value = response?.data || []
  } catch (err) {
    console.error('[Кейсы]: ошибка загрузки', err)
  } finally {
    loading.value = false
  }
}

// Переключение статуса публикации
const togglePublish = async (caseItem: any) => {
  try {
    const currentStatus = caseItem.isPublished ?? caseItem.is_published ?? false
    
    // 🔥 Отправляем как JSON (по умолчанию $fetch)
    await $fetch(`/api/portfolio/${caseItem.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, // явное указание
      body: { isPublished: !currentStatus }
    })
    
    // Обновляем локально
    caseItem.isPublished = !currentStatus
    caseItem.is_published = !currentStatus
  } catch (err) {
    console.error('[Кейсы]: ошибка обновления статуса', err)
    alert('Не удалось изменить статус')
  }
}

// Подтверждение удаления
const confirmDelete = (caseItem: any) => {
  caseToDelete.value = caseItem
  showDeleteModal.value = true
}

// Удаление кейса
const deleteCase = async () => {
  if (!caseToDelete.value) return // ✅ Явная проверка
  
  deleting.value = true
  try {
    await $fetch(`/api/portfolio/${caseToDelete.value.slug}`, {
      method: 'DELETE'
    })
    // ✅ Безопасное удаление из массива
    cases.value = cases.value.filter(c => c.id !== caseToDelete.value!.id)
    showDeleteModal.value = false
    caseToDelete.value = null
  } catch (err) {
    console.error('[Кейсы]: ошибка удаления', err)
    alert('Не удалось удалить кейс')
  } finally {
    deleting.value = false
  }
}

// ── Обработчики ───────────────────────────────────────────────────
const setActiveTab = (tab: string) => {
  activeTab.value = tab
}

// ── Жизненный цикл ────────────────────────────────────────────────
onMounted(() => {
  fetchCases()
})
</script>

<style lang="scss" scoped>
.portfolio-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

// ── Навигация ─────────────────────────────────────────────────────
.portfolio-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: var(--crm-accent-dim);
    }
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 1px 6px;
    background: var(--crm-bg-overlay);
    border-radius: 10px;
    color: var(--crm-text-muted);

    .tab--active & {
      background: rgba(0, 195, 245, .2);
      color: var(--crm-accent);
    }
  }
}

// Поиск
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--crm-text-muted);
  pointer-events: none;
}

.search-input {
  padding: 6px 10px 6px 30px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  width: 200px;
  transition: var(--crm-transition);

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &::placeholder {
    color: var(--crm-text-disabled);
  }
}

// ── Карточка списка ───────────────────────────────────────────────
.portfolio-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__footer {
    padding: 10px 16px;
    border-top: 1px solid var(--crm-border);
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── Список ────────────────────────────────────────────────────────
.case-list {
  list-style: none;
  padding: 0;
  margin: 0;

  &__item {
    &--alt {
      background: rgba(255, 255, 255, 0.022);
    }
  }
}

// ── Элемент кейса ─────────────────────────────────────────────────
.case-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--crm-border);

  .case-list__item:last-child & {
    border-bottom: none;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__category {
    font-size: var(--crm-text-xs);
    padding: 2px 8px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-sm);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: var(--crm-text-xs);
      color: var(--crm-text-muted);
    }
  }

  &__slug {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
    font-family: var(--crm-font-mono);

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
}

// ── Переключатель публикации ──────────────────────────────────────
.publish-toggle {
  width: 36px;
  height: 20px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: var(--crm-transition);

  .toggle-dot {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--crm-text-muted);
    border-radius: 50%;
    transition: var(--crm-transition);
  }

  &--on {
    background: var(--crm-success-dim);
    border-color: var(--crm-success);

    .toggle-dot {
      left: calc(100% - 16px);
      background: var(--crm-success);
    }
  }

  &:hover {
    border-color: var(--crm-accent);
  }
}

// ── Кнопки действий ───────────────────────────────────────────────
.action-buttons {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: var(--crm-transition);
  border: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  color: var(--crm-text-secondary);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--edit {
    &:hover {
      border-color: var(--crm-info);
      color: var(--crm-info);
    }
  }

  &--delete {
    &:hover {
      border-color: var(--crm-danger);
      color: var(--crm-danger);
      background: var(--crm-danger-dim);
    }
  }
}

// ── Скелетон / пустое ─────────────────────────────────────────────
.portfolio-skeleton {
  display: flex;
  flex-direction: column;
}

.skel {
  height: 76px;
  border-bottom: 1px solid var(--crm-border);
  background: linear-gradient(90deg, var(--crm-bg-elevated) 25%, var(--crm-bg-overlay) 50%, var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &:last-child {
    border-bottom: none;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.portfolio-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
}

// ── Модальное окно ────────────────────────────────────────────────
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;
  max-width: 400px;
  width: 90%;

  h3 {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0 0 10px 0;
  }

  p {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    margin: 0 0 20px 0;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// ── Кнопки ────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  text-decoration: none;

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, .25);
    }

    &:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border: 1px solid var(--crm-danger-border);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: rgba(242, 95, 92, .25);
    }
  }
}

// ── Адаптив ───────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .portfolio-page__content {
    padding: 16px;
  }

  .portfolio-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .case-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .case-item__actions {
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid var(--crm-border);
  }

  .case-item__slug span {
    max-width: 150px;
  }
}
</style>