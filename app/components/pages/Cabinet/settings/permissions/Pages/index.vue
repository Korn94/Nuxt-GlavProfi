<!-- app/components/pages/cabinet/settings/permissions/Pages/index.vue -->
<template>
  <div class="pages-view">
    <!-- ============================================
         ПАНЕЛЬ ИНСТРУМЕНТОВ
    ============================================ -->
    <div class="toolbar">
      <div class="toolbar-info">
        <Icon name="mdi:information-outline" size="18" />
        <span>
          Справочник разделов системы. Здесь определяются какие разделы существуют
          и какие действия они поддерживают.
        </span>
      </div>
      <div class="toolbar-actions">
        <div v-if="isSyncing" class="sync-indicator">
          <Icon name="mdi:sync" size="16" class="spin" />
          <span>Синхронизация...</span>
        </div>
        <button class="btn btn-secondary" @click="loadPages" :disabled="loading">
          <Icon name="mdi:refresh" size="16" />
          Обновить
        </button>
        <button
          v-if="isAdmin"
          class="btn btn-primary"
          @click="openCreateModal"
        >
          <Icon name="mdi:plus" size="16" />
          Добавить раздел
        </button>
      </div>
    </div>

    <!-- ============================================
         ЛОАДЕР
    ============================================ -->
    <div v-if="loading && pages.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка разделов...</p>
    </div>

    <!-- ============================================
         ПУСТОЕ СОСТОЯНИЕ
    ============================================ -->
    <div v-else-if="pages.length === 0" class="empty-state">
      <Icon name="mdi:file-document-outline" size="64" />
      <h3>Разделы не найдены</h3>
      <p>Справочник пуст. Создайте первый раздел системы.</p>
      <button v-if="isAdmin" class="btn btn-primary" @click="openCreateModal">
        <Icon name="mdi:plus" size="16" />
        Создать раздел
      </button>
    </div>

    <!-- ============================================
         СПИСОК СТРАНИЦ
    ============================================ -->
    <div v-else class="pages-list">
      <PagesCabinetSettingsPermissionsPagesPageCard
        v-for="(page, index) in pages"
        :key="page.slug"
        :page="page"
        :index="index"
        :total="pages.length"
        :is-admin="isAdmin"
        @edit="openEditModal"
        @toggle-active="handleToggleActive"
        @delete="openDeleteConfirm"
        @move-up="(p: SystemPage) => movePage(p, -1)"
        @move-down="(p: SystemPage) => movePage(p, 1)"
      />
    </div>

    <!-- ============================================
         МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ
    ============================================ -->
    <PagesCabinetSettingsPermissionsPagesPageEditModal
      v-model:is-open="editModal.isOpen"
      :is-edit="editModal.isEdit"
      :page="editModal.page"
      :saving="saving"
      @save="handleSavePage"
    />

    <!-- ============================================
         МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ
    ============================================ -->
    <PagesCabinetSettingsPermissionsPagesPageDeleteModal
      v-model:is-open="deleteConfirm.isOpen"
      :page="deleteConfirm.page"
      :hard="deleteConfirm.hard"
      :deleting="deleting"
      @confirm="handleConfirmDelete"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SystemPage } from '~/composables/usePermissionsApi'
import {
  fetchPermissionsPages,
  createPermissionsPage,
  updatePermissionsPage,
  deletePermissionsPage,
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
const saving = ref(false)
const deleting = ref(false)
const isSyncing = ref(false)
const pages = ref<SystemPage[]>([])

// Модалка создания/редактирования
const editModal = ref<{
  isOpen: boolean
  isEdit: boolean
  page: SystemPage | null
}>({
  isOpen: false,
  isEdit: false,
  page: null,
})

// Модалка удаления
const deleteConfirm = ref<{
  isOpen: boolean
  page: SystemPage | null
  hard: boolean
}>({
  isOpen: false,
  page: null,
  hard: false,
})

// Уведомления (глобальные, через store)
const notifications = useNotifications()

// ============================================
// REAL-TIME СИНХРОНИЗАЦИЯ ЧЕРЕЗ СОКЕТЫ
// ============================================
/**
 * Тихая перезагрузка списка (без сброса состояния модалок)
 * Используется при получении сокет-событий от других админов
 */
async function silentReload() {
  isSyncing.value = true
  try {
    const data = await fetchPermissionsPages()
    pages.value = data.sort((a, b) => a.order - b.order)
  } catch (error: any) {
    console.error('[Pages] Ошибка тихой перезагрузки:', error)
  } finally {
    isSyncing.value = false
  }
}

usePermissionsSocket({
  onPageCreated: async (data: any) => {
    console.log('[Pages] 📥 Новая страница создана другим админом:', data?.page?.name)
    notifications.info(`Раздел «${data?.page?.name}» создан ${data?.createdBy?.name || ''}`)
    await silentReload()
  },
  onPageUpdated: async (data: any) => {
    console.log('[Pages] 📥 Страница обновлена другим админом:', data?.page?.name)
    notifications.info(`Раздел «${data?.page?.name}» обновлён`)
    await silentReload()
  },
  onPageDeleted: async (data: any) => {
    console.log('[Pages] 📥 Страница удалена другим админом:', data?.name)
    const modeText = data?.mode === 'hard' ? 'полностью удалён' : 'скрыт'
    notifications.warning(`Раздел «${data?.name}» ${modeText}`)
    await silentReload()
  },
})

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
async function loadPages() {
  loading.value = true
  try {
    const data = await fetchPermissionsPages()
    pages.value = data.sort((a, b) => a.order - b.order)
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось загрузить разделы')
  } finally {
    loading.value = false
  }
}

// ============================================
// СОЗДАНИЕ / РЕДАКТИРОВАНИЕ
// ============================================
function openCreateModal() {
  editModal.value = {
    isOpen: true,
    isEdit: false,
    page: null,
  }
}

function openEditModal(page: SystemPage) {
  editModal.value = {
    isOpen: true,
    isEdit: true,
    page,
  }
}

/**
 * Обработчик сохранения (создание или обновление)
 * Принимает данные формы из PageEditModal
 */
async function handleSavePage(data: {
  slug: string
  name: string
  description: string
  icon: string
  order: number
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}) {
  saving.value = true
  try {
    if (editModal.value.isEdit) {
      await updatePermissionsPage(data.slug, {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        order: data.order,
        hasCreate: data.hasCreate,
        hasEdit: data.hasEdit,
        hasDelete: data.hasDelete,
        hasSpecial: data.hasSpecial,
      })
      notifications.success(`Раздел "${data.name}" обновлён`)
    } else {
      await createPermissionsPage({
        slug: data.slug,
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
        order: data.order,
        hasCreate: data.hasCreate,
        hasEdit: data.hasEdit,
        hasDelete: data.hasDelete,
        hasSpecial: data.hasSpecial,
      })
      notifications.success(`Раздел "${data.name}" создан`)
    }
    editModal.value.isOpen = false
    await loadPages()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось сохранить')
  } finally {
    saving.value = false
  }
}

// ============================================
// ПЕРЕМЕЩЕНИЕ ПОРЯДКА
// ============================================
async function movePage(page: SystemPage, direction: number) {
  const currentIndex = pages.value.findIndex(p => p.slug === page.slug)
  if (currentIndex === -1) return
  const newIndex = currentIndex + direction
  if (newIndex < 0 || newIndex >= pages.value.length) return

  const pageA = pages.value[currentIndex]
  const pageB = pages.value[newIndex]
  if (!pageA || !pageB) return

  // Оптимистичное обновление UI
  const updatedList = [...pages.value]
  updatedList[currentIndex] = pageB
  updatedList[newIndex] = pageA
  pages.value = updatedList

  try {
    await Promise.all([
      updatePermissionsPage(pageB.slug, { order: currentIndex }),
      updatePermissionsPage(pageA.slug, { order: newIndex }),
    ])
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось изменить порядок')
    await loadPages()
  }
}

// ============================================
// АКТИВАЦИЯ / ДЕАКТИВАЦИЯ
// ============================================
async function handleToggleActive(page: SystemPage, newActive: boolean) {
  try {
    await updatePermissionsPage(page.slug, { isActive: newActive })
    notifications.success(
      `Раздел "${page.name}" ${newActive ? 'активирован' : 'скрыт'}`
    )
    await loadPages()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось изменить статус')
  }
}

// ============================================
// УДАЛЕНИЕ
// ============================================
function openDeleteConfirm(page: SystemPage, hard: boolean) {
  deleteConfirm.value = {
    isOpen: true,
    page,
    hard,
  }
}

async function handleConfirmDelete(hard: boolean) {
  const page = deleteConfirm.value.page
  if (!page) return
  deleting.value = true
  try {
    const result = await deletePermissionsPage(page.slug, hard)
    notifications.success(result.message)
    deleteConfirm.value.isOpen = false
    await loadPages()
  } catch (error: any) {
    notifications.error(error.message || 'Не удалось удалить')
  } finally {
    deleting.value = false
  }
}

// ============================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ============================================
onMounted(() => {
  loadPages()
})
</script>

<style lang="scss" scoped>
span {
  color: unset;
}

.pages-view {
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

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  flex: 1;
  min-width: 200px;

  svg {
    color: var(--crm-info);
    flex-shrink: 0;
  }
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

// ── СПИСОК СТРАНИЦ ────────────────────────────────────────
.pages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
}

.btn-primary {
  background: var(--crm-accent);
  color: white;
  &:hover:not(:disabled) { background: var(--crm-accent-hover); }
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

// ── АДАПТИВНОСТЬ ──────────────────────────────────────────
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>