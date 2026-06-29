<!-- app/components/pages/cabinet/settings/permissions/Users/index.vue -->
<template>
  <div class="users-view">
    <!-- ============================================
         ПАНЕЛЬ ИНСТРУМЕНТОВ
    ============================================ -->
    <div class="toolbar">
      <div class="toolbar-controls">
        <!-- Поиск -->
        <div class="search-box">
          <Icon name="mdi:magnify" size="18" />
          <input
            v-model="search"
            type="text"
            placeholder="Поиск по имени или логину..."
            @input="debouncedSearch"
          />
          <button
            v-if="search"
            class="clear-btn"
            @click="clearSearch"
            title="Очистить поиск"
          >
            <Icon name="mdi:close" size="16" />
          </button>
        </div>

        <!-- Фильтр по роли -->
        <div class="filter-box">
          <Icon name="mdi:filter-variant" size="18" />
          <select v-model="filterRole" @change="reloadUsers">
            <option value="">Все роли</option>
            <option
              v-for="role in availableRoles"
              :key="role.value"
              :value="role.value"
            >
              {{ role.label }}
            </option>
          </select>
        </div>

        <!-- Фильтр: только с переопределениями -->
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="onlyWithOverrides"
            @change="reloadUsers"
          />
          <span class="toggle-text">Только с переопределениями</span>
        </label>
      </div>

      <div class="toolbar-actions">
        <div v-if="isSyncing" class="sync-indicator">
          <Icon name="mdi:sync" size="16" class="spin" />
          <span>Синхронизация...</span>
        </div>

        <!-- Bulk: выбрать всех на странице -->
        <label v-if="users.length > 0" class="toggle-label">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span class="toggle-text">Выбрать всех</span>
        </label>

        <button class="btn btn-secondary" @click="loadData" :disabled="loading">
          <Icon name="mdi:refresh" size="16" />
          Обновить
        </button>
      </div>
    </div>

    <!-- ============================================
         ЛОАДЕР
    ============================================ -->
    <div v-if="loading && users.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка пользователей...</p>
    </div>

    <!-- ============================================
         ПУСТОЕ СОСТОЯНИЕ
    ============================================ -->
    <div v-else-if="users.length === 0" class="empty-state">
      <Icon name="mdi:account-search-outline" size="64" />
      <h3>{{ emptyStateTitle }}</h3>
      <p>{{ emptyStateMessage }}</p>
      <button
        v-if="search || filterRole || onlyWithOverrides"
        class="btn btn-primary"
        @click="resetFilters"
      >
        Сбросить фильтры
      </button>
      <button v-else class="btn btn-primary" @click="loadData">
        Попробовать снова
      </button>
    </div>

    <!-- ============================================
         СПИСОК ПОЛЬЗОВАТЕЛЕЙ + ПАГИНАЦИЯ
    ============================================ -->
    <template v-else>
      <div class="users-list">
        <PagesCabinetSettingsPermissionsUsersUserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :pages="pages"
          :is-admin="isAdmin"
          :removing="removing"
          :selected="selectedUserIds.has(user.id)"
          @toggle-select="(u: UserWithPermissions) => toggleSelect(u.id)"
          @add-override="openAddOverrideModal"
          @clear-overrides="openClearOverridesConfirm"
          @remove-override="openRemoveOverrideConfirm"
        />
      </div>

      <!-- Пагинация -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="btn btn-ghost btn-sm"
          :disabled="pagination.page === 1"
          @click="goToPage(pagination.page - 1)"
        >
          <Icon name="mdi:chevron-left" size="18" />
        </button>
        <div class="page-numbers">
          <button
            v-for="pageNum in displayedPages"
            :key="pageNum"
            :class="['page-btn', { active: pageNum === pagination.page }]"
            :disabled="pageNum === -1"
            @click="pageNum !== -1 && goToPage(pageNum)"
          >
            {{ pageNum === -1 ? '…' : pageNum }}
          </button>
        </div>
        <button
          class="btn btn-ghost btn-sm"
          :disabled="pagination.page === pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          <Icon name="mdi:chevron-right" size="18" />
        </button>
        <span class="pagination-info">
          {{ pagination.total }} {{ pluralizeUsersTotal(pagination.total) }}
        </span>
      </div>
    </template>

    <!-- ============================================
         МОДАЛКА ДОБАВЛЕНИЯ ПЕРЕОПРЕДЕЛЕНИЯ
    ============================================ -->
    <PagesCabinetSettingsPermissionsUsersAddOverrideModal
      v-model:is-open="addOverrideModal.isOpen"
      :user="addOverrideModal.user"
      :pages="pages"
      :saving="savingOverride"
      @save="handleSaveOverride"
    />

    <!-- ============================================
         МОДАЛКА УДАЛЕНИЯ ОДНОГО ПЕРЕОПРЕДЕЛЕНИЯ
    ============================================ -->
    <PagesCabinetSettingsPermissionsUsersRemoveOverrideModal
      v-model:is-open="removeOverrideConfirm.isOpen"
      :user="removeOverrideConfirm.user"
      :page-slug="removeOverrideConfirm.pageSlug"
      :pages="pages"
      :removing="removing"
      @confirm="handleConfirmRemoveOverride"
    />

    <!-- ============================================
         МОДАЛКА СБРОСА ВСЕХ ПЕРЕОПРЕДЕЛЕНИЙ
    ============================================ -->
    <PagesCabinetSettingsPermissionsUsersClearOverridesModal
      v-model:is-open="clearOverridesConfirm.isOpen"
      :user="clearOverridesConfirm.user"
      :pages="pages"
      :clearing="clearing"
      @confirm="handleConfirmClearOverrides"
    />

    <!-- ============================================
         МОДАЛКА ПОДТВЕРЖДЕНИЯ МАССОВОГО СБРОСА
    ============================================ -->
    <PagesCabinetSettingsPermissionsUsersBulkClearModal
      v-model:is-open="bulkClearConfirm.isOpen"
      :count="bulkClearConfirm.count"
      :clearing="bulkClearing"
      @confirm="handleBulkClearOverrides"
    />

    <!-- ============================================
         ПАНЕЛЬ МАССОВЫХ ДЕЙСТВИЙ
    ============================================ -->
    <Transition name="slide-up">
      <div v-if="selectedUserIds.size > 0" class="bulk-actions-bar">
        <div class="bulk-info">
          <Icon name="mdi:checkbox-multiple-marked" size="20" />
          <span>
            Выбрано: <strong>{{ selectedUserIds.size }}</strong>
            {{ pluralizeUsersTotal(selectedUserIds.size) }}
          </span>
        </div>
        <div class="bulk-actions">
          <button
            class="btn btn-secondary btn-sm"
            @click="clearSelection"
            :disabled="bulkClearing"
          >
            <Icon name="mdi:close" size="14" />
            Снять выделение
          </button>
          <button
            class="btn btn-warning btn-sm"
            @click="openBulkClearConfirm"
            :disabled="bulkClearing"
          >
            <Icon name="mdi:broom" size="14" />
            Сбросить все переопределения
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type {
  SystemPage,
  UserWithPermissions,
  UserOverride,
  PaginationResponse,
} from '~/composables/usePermissionsApi'
import {
  fetchPermissionsPages,
  fetchPermissionsUsers,
  applyUserOverrides,
  removeUserOverride,
  clearUserOverrides,
} from '~/composables/usePermissionsApi'
import { useAuthStore } from 'stores/auth'
import { usePermissionsSocket } from '../composables/usePermissionsSocket'
import { useNotifications } from '~/composables/useNotifications'

// ============================================
// STORE И ПРАВА ДОСТУПА
// ============================================
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

// ============================================
// СОСТОЯНИЕ
// ============================================
const loading = ref(false)
const savingOverride = ref(false)
const removing = ref(false)
const clearing = ref(false)
const bulkClearing = ref(false)
const isSyncing = ref(false)
const users = ref<UserWithPermissions[]>([])
const pages = ref<SystemPage[]>([])
const pagination = ref<PaginationResponse>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})

// Bulk-выделение
const selectedUserIds = ref<Set<number>>(new Set())

// Фильтры
const search = ref('')
const filterRole = ref('')
const onlyWithOverrides = ref(false)

// Модалки
const addOverrideModal = ref<{
  isOpen: boolean
  user: UserWithPermissions | null
}>({
  isOpen: false,
  user: null,
})

const removeOverrideConfirm = ref<{
  isOpen: boolean
  user: UserWithPermissions | null
  pageSlug: string
}>({
  isOpen: false,
  user: null,
  pageSlug: '',
})

const clearOverridesConfirm = ref<{
  isOpen: boolean
  user: UserWithPermissions | null
}>({
  isOpen: false,
  user: null,
})

const bulkClearConfirm = ref<{
  isOpen: boolean
  count: number
}>({
  isOpen: false,
  count: 0,
})

// Уведомления (глобальные, через store)
const notifications = useNotifications()

// ============================================
// КОНСТАНТЫ И СЛОВАРИ
// ============================================
const availableRoles = [
  { value: 'admin', label: 'Администратор' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'foreman', label: 'Прораб' },
  { value: 'master', label: 'Мастер' },
  { value: 'worker', label: 'Рабочий' },
]

// ============================================
// COMPUTED
// ============================================
const emptyStateTitle = computed(() => {
  if (search.value || filterRole.value || onlyWithOverrides.value) {
    return 'Пользователи не найдены'
  }
  return 'Список пуст'
})

const emptyStateMessage = computed(() => {
  if (search.value || filterRole.value || onlyWithOverrides.value) {
    return 'Попробуйте изменить параметры поиска или сбросить фильтры'
  }
  return 'Не удалось загрузить список пользователей'
})

/**
 * Выбраны ли все пользователи на текущей странице
 */
const isAllSelected = computed(() => {
  if (users.value.length === 0) return false
  return users.value.every(u => selectedUserIds.value.has(u.id))
})

/**
 * Indeterminate-состояние чекбокса "Выбрать всех"
 * (выбрано несколько, но не все)
 */
const isIndeterminate = computed(() => {
  if (users.value.length === 0) return false
  const selectedOnPage = users.value.filter(u => selectedUserIds.value.has(u.id)).length
  return selectedOnPage > 0 && selectedOnPage < users.value.length
})

/**
 * Отображаемые номера страниц (с разделителями)
 */
const displayedPages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push(-1)
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i)
    }
    if (current < total - 2) pages.push(-1)
    pages.push(total)
  }
  return pages
})

// ============================================
// REAL-TIME СИНХРОНИЗАЦИЯ
// ============================================
/**
 * Тихая перезагрузка списка при получении сокет-события от другого админа.
 * Сохраняет выделение, если выбранные пользователи всё ещё есть на странице.
 */
async function silentReload() {
  isSyncing.value = true
  try {
    const [usersData, pagesData] = await Promise.all([
      fetchPermissionsUsers({
        search: search.value || undefined,
        role: filterRole.value || undefined,
        page: pagination.value.page,
        limit: pagination.value.limit,
        withOverrides: onlyWithOverrides.value,
      }),
      fetchPermissionsPages(),
    ])
    users.value = usersData.users
    pages.value = pagesData
    pagination.value = usersData.pagination

    // Очищаем выделение для пользователей, которых больше нет в списке
    const currentIds = new Set(users.value.map(u => u.id))
    const newSelection = new Set<number>()
    for (const id of selectedUserIds.value) {
      if (currentIds.has(id)) newSelection.add(id)
    }
    selectedUserIds.value = newSelection
  } catch (error: any) {
    console.error('[Users] Ошибка тихой перезагрузки:', error)
  } finally {
    isSyncing.value = false
  }
}

usePermissionsSocket({
  onPermissionsChanged: async (data: any) => {
    console.log('[Users] 📥 Права изменены другим админом:', data?.reason)
    notifications.info(`Права обновлены: ${data?.reason || 'изменения применены'}`)
    await silentReload()
  },
})

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
async function loadData() {
  loading.value = true
  try {
    const [usersData, pagesData] = await Promise.all([
      fetchPermissionsUsers({
        search: search.value || undefined,
        role: filterRole.value || undefined,
        page: pagination.value.page,
        limit: pagination.value.limit,
        withOverrides: onlyWithOverrides.value,
      }),
      fetchPermissionsPages(),
    ])
    users.value = usersData.users
    pages.value = pagesData
    pagination.value = usersData.pagination
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось загрузить данные')
  } finally {
    loading.value = false
  }
}

async function reloadUsers() {
  pagination.value.page = 1
  await loadData()
}

// ============================================
// ПОИСК (DEBOUNCE)
// ============================================
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    reloadUsers()
  }, 400)
}

function clearSearch() {
  search.value = ''
  reloadUsers()
}

function resetFilters() {
  search.value = ''
  filterRole.value = ''
  onlyWithOverrides.value = false
  reloadUsers()
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  loadData()
}

// ============================================
// BULK-ВЫДЕЛЕНИЕ
// ============================================
function toggleSelect(userId: number) {
  const newSet = new Set(selectedUserIds.value)
  if (newSet.has(userId)) {
    newSet.delete(userId)
  } else {
    newSet.add(userId)
  }
  selectedUserIds.value = newSet
}

function toggleSelectAll() {
  const newSet = new Set(selectedUserIds.value)
  if (isAllSelected.value) {
    // Снимаем выделение со всех на текущей странице
    for (const user of users.value) {
      newSet.delete(user.id)
    }
  } else {
    // Выделяем всех на текущей странице
    for (const user of users.value) {
      newSet.add(user.id)
    }
  }
  selectedUserIds.value = newSet
}

function clearSelection() {
  selectedUserIds.value = new Set()
}

// ============================================
// МОДАЛКА ДОБАВЛЕНИЯ ПЕРЕОПРЕДЕЛЕНИЯ
// ============================================
function openAddOverrideModal(user: UserWithPermissions) {
  addOverrideModal.value = {
    isOpen: true,
    user,
  }
}

async function handleSaveOverride(data: {
  pageSlug: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
  reason: string
  expiresAt: string
}) {
  const user = addOverrideModal.value.user
  if (!user) return
  savingOverride.value = true
  try {
    const override = {
      pageSlug: data.pageSlug,
      canView: data.canView,
      canCreate: data.canCreate,
      canEdit: data.canEdit,
      canDelete: data.canDelete,
      canSpecial: data.canSpecial,
      ...(data.reason.trim() ? { reason: data.reason.trim() } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt).toISOString() } : {}),
    }
    await applyUserOverrides(user.id, [override])
    notifications.success('Переопределение успешно применено')
    addOverrideModal.value.isOpen = false
    await loadData()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось применить переопределение')
  } finally {
    savingOverride.value = false
  }
}

// ============================================
// МОДАЛКА УДАЛЕНИЯ ОДНОГО ПЕРЕОПРЕДЕЛЕНИЯ
// ============================================
function openRemoveOverrideConfirm(
  user: UserWithPermissions,
  pageSlug: string
) {
  removeOverrideConfirm.value = {
    isOpen: true,
    user,
    pageSlug,
  }
}

async function handleConfirmRemoveOverride() {
  const user = removeOverrideConfirm.value.user
  const pageSlug = removeOverrideConfirm.value.pageSlug
  if (!user || !pageSlug) return
  removing.value = true
  try {
    const result = await removeUserOverride(user.id, pageSlug)
    if (result.deleted) {
      notifications.success('Переопределение успешно удалено')
    } else {
      notifications.warning('Переопределение не найдено')
    }
    removeOverrideConfirm.value.isOpen = false
    await loadData()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось удалить переопределение')
  } finally {
    removing.value = false
  }
}

// ============================================
// МОДАЛКА СБРОСА ВСЕХ ПЕРЕОПРЕДЕЛЕНИЙ (один пользователь)
// ============================================
function openClearOverridesConfirm(user: UserWithPermissions) {
  clearOverridesConfirm.value = {
    isOpen: true,
    user,
  }
}

async function handleConfirmClearOverrides() {
  const user = clearOverridesConfirm.value.user
  if (!user) return
  clearing.value = true
  try {
    const result = await clearUserOverrides(user.id)
    notifications.success(result.message)
    clearOverridesConfirm.value.isOpen = false
    await loadData()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось сбросить переопределения')
  } finally {
    clearing.value = false
  }
}

// ============================================
// МАССОВЫЙ СБРОС ПЕРЕОПРЕДЕЛЕНИЙ
// ============================================
function openBulkClearConfirm() {
  bulkClearConfirm.value = {
    isOpen: true,
    count: selectedUserIds.value.size,
  }
}

async function handleBulkClearOverrides() {
  if (selectedUserIds.value.size === 0) return
  bulkClearing.value = true
  const userIds = Array.from(selectedUserIds.value)
  let successCount = 0
  let failCount = 0

  try {
    // Параллельные запросы для каждого выбранного пользователя
    const results = await Promise.allSettled(
      userIds.map(id => clearUserOverrides(id))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failCount++
      }
    }

    if (failCount === 0) {
      notifications.success(
        `Переопределения сброшены для ${successCount} ${pluralizeUsersTotal(successCount)}`
      )
    } else {
      notifications.warning(
        `Сброшено: ${successCount}. Ошибок: ${failCount}`
      )
    }

    bulkClearConfirm.value.isOpen = false
    clearSelection()
    await loadData()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось выполнить массовый сброс')
  } finally {
    bulkClearing.value = false
  }
}

// ============================================
// ПЛЮРАЛИЗАЦИЯ
// ============================================
function pluralizeUsersTotal(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователь'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователя'
  return 'пользователей'
}

// ============================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ============================================
onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style lang="scss" scoped>
span {
  color: unset;
}

.users-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 5rem; // Место для bulk-actions-bar
}

// ── ПАНЕЛЬ ИНСТРУМЕНТОВ ───────────────────────────────────
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  flex-wrap: wrap;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  font-weight: 500;

  svg {
    animation: spin 0.8s linear infinite;
  }
}

.search-box,
.filter-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: all var(--crm-transition);

  &:focus-within {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  svg {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }
}

.search-box {
  flex: 1;
  min-width: 200px;

  input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-sans);

    &::placeholder {
      color: var(--crm-text-muted);
    }
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--crm-bg-overlay);
    color: var(--crm-text-secondary);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all var(--crm-transition);

    &:hover {
      background: var(--crm-danger-dim);
      color: var(--crm-danger);
    }
  }
}

.filter-box select {
  background: transparent;
  border: none;
  outline: none;
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-sans);
  cursor: pointer;
  padding-right: 0.5rem;

  option {
    background: var(--crm-bg-surface);
    color: var(--crm-text-primary);
  }
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--crm-accent);
    cursor: pointer;
  }

  .toggle-text {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    white-space: nowrap;
  }
}

// ── СОСТОЯНИЯ ─────────────────────────────────────────────
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--crm-text-secondary);

  svg { color: var(--crm-text-muted); }
  h3 { margin: 0; color: var(--crm-text-primary); font-size: var(--crm-text-lg); }
  p { margin: 0; max-width: 400px; font-size: var(--crm-text-sm); }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--crm-border);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── СПИСОК ПОЛЬЗОВАТЕЛЕЙ ──────────────────────────────────
.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

// ── ПАГИНАЦИЯ ─────────────────────────────────────────────
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.5rem;
  background: transparent;
  color: var(--crm-text-secondary);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--crm-transition);
  font-family: var(--crm-font-sans);

  &:hover:not(.active):not(:disabled) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &.active {
    background: var(--crm-accent);
    border-color: var(--crm-accent);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  margin-left: 0.5rem;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
}

// ── ПАНЕЛЬ МАССОВЫХ ДЕЙСТВИЙ ──────────────────────────────
.bulk-actions-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-lg);
  box-shadow: var(--crm-shadow-lg), 0 0 0 4px var(--crm-accent-dim);
  z-index: 100;
  backdrop-filter: blur(8px);
  max-width: calc(100vw - 2rem);
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  white-space: nowrap;

  svg {
    color: var(--crm-accent);
  }

  strong {
    color: var(--crm-accent);
    font-weight: 600;
  }
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

// ── КНОПКИ ────────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: var(--crm-text-xs);
  }
}

.btn-primary {
  background: var(--crm-accent);
  color: white;

  &:hover:not(:disabled) {
    background: var(--crm-accent-hover);
  }
}

.btn-secondary {
  background: var(--crm-bg-overlay);
  color: var(--crm-text-primary);
  border-color: var(--crm-border);

  &:hover:not(:disabled) {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--crm-text-secondary);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

.btn-warning {
  background: var(--crm-warning);
  color: white;

  &:hover:not(:disabled) {
    background: #e09500;
  }
}

// ── АНИМАЦИИ ──────────────────────────────────────────────
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

// ── АДАПТИВНОСТЬ ──────────────────────────────────────────
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-controls {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .toolbar-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .pagination {
    flex-direction: column;
    gap: 0.75rem;
  }

  .bulk-actions-bar {
    flex-direction: column;
    gap: 0.75rem;
    bottom: 1rem;
    width: calc(100% - 2rem);

    .bulk-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
}
</style>