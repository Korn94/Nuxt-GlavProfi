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

      <button class="btn btn-secondary" @click="loadData" :disabled="loading">
        <Icon name="mdi:refresh" size="16" />
        Обновить
      </button>
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
         ОБЩИЙ TOAST
    ============================================ -->
    <PagesCabinetSettingsPermissionsSharedToast
      v-model:show="toast.show"
      :type="toast.type"
      :message="toast.message"
    />
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

const users = ref<UserWithPermissions[]>([])
const pages = ref<SystemPage[]>([])
const pagination = ref<PaginationResponse>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})

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

// Toast уведомления
const toast = ref<{
  show: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}>({
  show: false,
  type: 'success',
  message: '',
})

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
 * Отображаемые номера страниц (с разделителями)
 * Логика: показываем первую, последнюю, текущую ±1, разделители
 */
const displayedPages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push(-1) // разделитель
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i)
    }
    if (current < total - 2) pages.push(-1) // разделитель
    pages.push(total)
  }

  return pages
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
    showToast(error.message || 'Не удалось загрузить данные', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Перезагрузка с сбросом на первую страницу
 * Используется при изменении фильтров
 */
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
// МОДАЛКА ДОБАВЛЕНИЯ ПЕРЕОПРЕДЕЛЕНИЯ
// ============================================
function openAddOverrideModal(user: UserWithPermissions) {
  addOverrideModal.value = {
    isOpen: true,
    user,
  }
}

/**
 * Сохранение нового переопределения
 * Принимает данные формы из AddOverrideModal
 */
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
    // Собираем объект с условным добавлением опциональных полей
    const override = {
      pageSlug: data.pageSlug,
      canView: data.canView,
      canCreate: data.canCreate,
      canEdit: data.canEdit,
      canDelete: data.canDelete,
      canSpecial: data.canSpecial,
      // Условное добавление через spread
      ...(data.reason.trim() ? { reason: data.reason.trim() } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt).toISOString() } : {}),
    }

    await applyUserOverrides(user.id, [override])
    showToast('Переопределение успешно применено', 'success')
    addOverrideModal.value.isOpen = false
    await loadData()
  } catch (error: any) {
    showToast(error.message || 'Не удалось применить переопределение', 'error')
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
    showToast(
      result.deleted
        ? 'Переопределение успешно удалено'
        : 'Переопределение не найдено',
      result.deleted ? 'success' : 'warning'
    )
    removeOverrideConfirm.value.isOpen = false
    await loadData()
  } catch (error: any) {
    showToast(error.message || 'Не удалось удалить переопределение', 'error')
  } finally {
    removing.value = false
  }
}

// ============================================
// МОДАЛКА СБРОСА ВСЕХ ПЕРЕОПРЕДЕЛЕНИЙ
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
    showToast(result.message, 'success')
    clearOverridesConfirm.value.isOpen = false
    await loadData()
  } catch (error: any) {
    showToast(error.message || 'Не удалось сбросить переопределения', 'error')
  } finally {
    clearing.value = false
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
// TOAST УВЕДОМЛЕНИЯ
// ============================================
function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
  toast.value = { show: true, type, message }
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

  .pagination {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>