<!-- app/pages/cabinet/contractors/index.vue -->
<template>
  <div class="contractors-all-page">
    <!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
    <PageTitle title="Сотрудники" icon="mdi:account-group" :badge="filteredContractors.length">
      <template #actions>
        <!-- ✅ Кнопка перехода к пользователям (только для админа) -->
        <NuxtLink 
          v-if="isAdmin" 
          to="/cabinet/admin/users" 
          class="btn btn--ghost btn--sm"
        >
          <Icon name="mdi:account-cog" size="14" />
          Пользователи
        </NuxtLink>

        <!-- Кнопка добавления сотрудника -->
        <button class="btn btn--primary btn--sm" @click="openTypeSelectModal">
          <Icon name="mdi:plus" size="14" />
          Добавить
        </button>
      </template>
    </PageTitle>

    <!-- ═══════════════════════════ FILTERS ══════════════════════════ -->
    <div class="list-controls">
      <div class="search-box">
        <Icon name="mdi:magnify" size="16" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Поиск по имени..." class="input search-input"
          autocomplete="off" />
      </div>

      <div class="filter-chips">
        <button :class="['chip', { 'chip--active': filterType === null }]" @click="filterType = null">
          Все
        </button>
        <button v-for="t in contractorTypes" :key="t.value"
          :class="['chip', { 'chip--active': filterType === t.value }]"
          @click="filterType = filterType === t.value ? null : t.value">
          {{ t.label }}
        </button>

        <button :class="['chip', 'chip--toggle', { 'chip--active': onlyWithUser }]"
          @click="onlyWithUser = !onlyWithUser" title="Показать только привязанных к пользователям">
          <Icon name="mdi:account-check" size="12" />
          <span>С пользователем</span>
        </button>

        <button v-if="hasActiveFilters" class="chip chip--clear" @click="resetFilters" title="Сбросить фильтры">
          ✕
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════ LIST ═════════════════════════════ -->
    <div class="list-container">
      <div v-if="isLoading" class="state-block">
        <span class="spinner" /> Загрузка контрагентов...
      </div>

      <div v-else-if="filteredContractors.length === 0" class="state-block">
        <Icon name="mdi:account-off" size="32" />
        <span>Контрагенты не найдены</span>
      </div>

      <div v-else class="cards-grid">
        <div v-for="c in filteredContractors" :key="`${c.type}-${c.id}`" class="contractor-card"
          @click="goToContractor(c.type, c.id)">
          <!-- 1. Имя + Заметка (занимает всё доступное место) -->
          <div class="col col--info">
            <div class="row-main">
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(c.id) }">
                {{ getInitials(c.name) }}
              </div>
              <div class="info">
                <span class="name">{{ c.name }}</span>
                <span v-if="c.comment" class="comment" :title="c.comment">{{ truncateComment(c.comment) }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Тип контрагента -->
          <div class="col col--type">
            <span :class="['type-badge', `type-badge--${c.type}`]">
              {{ typeLabels[c.type] }}
            </span>
          </div>

          <!-- 3. Привязка -->
          <div class="col col--link">
            <span v-if="c.user" class="user-icon" :title="`Привязан: ${c.user.name || c.user.login}`">
              <Icon name="mdi:account-check" size="14" />
            </span>
            <span v-else class="no-user" title="Не привязан">—</span>
          </div>

          <!-- 4. Баланс -->
          <div class="col col--balance">
            <span :class="['balance-value', getBalanceClass(c.balance)]">
              {{ formatBalance(c.balance) }}
            </span>
          </div>

          <!-- 5. Действия -->
          <div class="col col--actions">
            <button class="action-btn" title="Редактировать" @click.stop="openEditModal(c)">
              <Icon name="mdi:pencil" size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════ MODALS ═══════════════════════════ -->
    <Modal :visible="isTypeSelectOpen" title="Новый контрагент" size="sm" @update:visible="isTypeSelectOpen = false">
      <div class="type-select">
        <p class="type-select__hint">Выберите тип контрагента:</p>
        <div class="type-select__buttons">
          <button v-for="t in contractorTypes" :key="t.value" class="type-btn" @click="startCreate(t.value)">
            <Icon :name="t.icon" size="18" />
            <span>{{ t.label }}</span>
          </button>
        </div>
      </div>
    </Modal>

    <Modal :visible="isFormModalOpen" :title="editingContractor ? 'Редактирование' : 'Новый контрагент'" size="md"
      @update:visible="closeFormModal">
      <PagesCabinetContractorsContractorForm v-if="isFormModalOpen" :type="formType" :contractor="editingContractor"
        :show-user-select="true" @save="handleSave" @close="closeFormModal" />
    </Modal>

    <Modal :visible="isDeleteConfirmOpen" title="Подтверждение удаления" size="sm"
      @update:visible="isDeleteConfirmOpen = false">
      <div class="delete-confirm">
        <p>Удалить контрагента <strong>{{ targetContractor?.name }}</strong>?</p>
        <p class="delete-warning">⚠️ Это действие нельзя отменить.</p>
        <div class="confirm-actions">
          <button class="btn btn--sm" @click="isDeleteConfirmOpen = false">Отмена</button>
          <button class="btn btn--sm btn--danger" @click="handleDelete" :disabled="isDeleting">
            {{ isDeleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageTitle from '~/components/pages/cabinet/ui/layout/PageTitle.vue'
import Modal from '~/components/pages/cabinet/ui/Modal.vue'
import { useContractors } from '~/composables/useContractors'
import type { ContractorType, ContractorDTO } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

definePageMeta({ layout: 'cabinet', middleware: ['require-auth'] })

const router = useRouter()
const contractorsStore = useContractors()

// ── UI State ─────────────────────────────────────────────────────────
const isLoading = ref(true)
const searchQuery = ref('')
const filterType = ref<ContractorType | null>(null)
const onlyWithUser = ref(false)

const isTypeSelectOpen = ref(false)
const isFormModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const formType = ref<ContractorType | null>(null)
const editingContractor = ref<ContractorDTO | null>(null)
const targetContractor = ref<ContractorDTO | null>(null)
const isDeleting = ref(false)
const isAdmin = ref(false)

// ── Types config ─────────────────────────────────────────────────────
const contractorTypes: Array<{ value: ContractorType; label: string; icon: string }> = [
  { value: 'master', label: 'Мастер', icon: 'mdi:hammer' },
  { value: 'worker', label: 'Рабочий', icon: 'mdi:wrench' },
  { value: 'foreman', label: 'Прораб', icon: 'mdi:clipboard-check' },
  { value: 'office', label: 'Офис', icon: 'mdi:office-building' }
]

const typeLabels: Record<ContractorType, string> = {
  master: 'Мастер', worker: 'Рабочий', foreman: 'Прораб', office: 'Офис'
}

// ── Unified list ─────────────────────────────────────────────────────
const allContractors = computed(() =>
  CONTRACTOR_TYPES.flatMap(type =>
    contractorsStore.getByType(type).map(c => ({ ...c, type }))
  )
)

// ── Filtering ────────────────────────────────────────────────────────
const filteredContractors = computed(() => {
  let list = allContractors.value

  if (filterType.value) list = list.filter(c => c.type === filterType.value)
  if (onlyWithUser.value) list = list.filter(c => c.userId !== null)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }

  return list
})

const hasActiveFilters = computed(() =>
  filterType.value !== null || onlyWithUser.value || searchQuery.value.trim() !== ''
)

function resetFilters() {
  filterType.value = null
  onlyWithUser.value = false
  searchQuery.value = ''
}

// ── Helpers ──────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
}

// ✅ ИСПРАВЛЕНИЕ TS ОШИБКИ: явное указание возврата string
function getAvatarColor(id: number): string {
  const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c']
  return colors[id % colors.length] || '#00c3f5'
}

function truncateComment(text: string, maxLen = 40): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

function formatBalance(val: string | number | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val || 0)
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num)
}

function getBalanceClass(val: string | number | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val || 0)
  if (num > 0) return 'balance-value--positive'
  if (num < 0) return 'balance-value--negative'
  return 'balance-value--neutral'
}

// ── Navigation ───────────────────────────────────────────────────────
function goToContractor(type: ContractorType, id: number) {
  router.push(`/cabinet/contractors/${type}/${id}`)
}

// ── Modals ───────────────────────────────────────────────────────────
function openTypeSelectModal() { isTypeSelectOpen.value = true }
function startCreate(type: ContractorType) {
  isTypeSelectOpen.value = false
  formType.value = type
  editingContractor.value = null
  isFormModalOpen.value = true
}
function openEditModal(c: ContractorDTO) {
  formType.value = c.type
  editingContractor.value = { ...c }
  isFormModalOpen.value = true
}
function closeFormModal() {
  isFormModalOpen.value = false
  editingContractor.value = null
  formType.value = null
}

// ── Actions ──────────────────────────────────────────────────────────
async function handleSave(formData: any) {
  if (!formType.value) return
  try {
    if (editingContractor.value) {
      await contractorsStore.update(formType.value, editingContractor.value.id, formData)
    } else {
      await contractorsStore.create(formType.value, formData)
    }
    closeFormModal()
  } catch (err: any) { console.error('Ошибка сохранения:', err.message) }
}

async function handleDelete() {
  if (!targetContractor.value) return
  isDeleting.value = true
  try {
    await contractorsStore.deleteContractor(targetContractor.value.type, targetContractor.value.id)
    isDeleteConfirmOpen.value = false
    targetContractor.value = null
  } catch (err: any) { console.error('Ошибка удаления:', err.message) } finally { isDeleting.value = false }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  try { 
    await Promise.all(CONTRACTOR_TYPES.map(t => contractorsStore.fetchAll(t))) 
  } catch (err) { 
    console.error('[Contractors] Ошибка загрузки:', err) 
  } finally { 
    isLoading.value = false 
  }
  
  // ✅ Проверяем роль текущего пользователя с явной типизацией
  try {
    const response = await $fetch<{ user: { role: string } }>('/api/me', { 
      credentials: 'include' 
    })
    if (response.user?.role === 'admin') {
      isAdmin.value = true
    }
  } catch (e) {
    // Ошибка не критична, просто скрываем кнопку
    console.log('[Contractors] Не удалось проверить роль админа')
  }
})
</script>

<style lang="scss" scoped>
.contractors-all-page {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  padding-bottom: 40px;
}

// ── Controls ───────────────────────────────────────────────────────
.list-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--crm-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  transition: var(--crm-transition);

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
    outline: none;
  }
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  padding: 6px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: 20px;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
    font-weight: 600;
  }

  &--toggle {
    &.chip--active {
      background: var(--crm-success-dim);
      border-color: rgba(61, 214, 140, 0.3);
      color: var(--crm-success);
    }
  }

  &--clear {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
    padding: 6px 10px;
  }
}

.btn--ghost {
  background: transparent;
  border-color: var(--crm-border-hover);
  color: var(--crm-text-secondary);
  
  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }
}

// ── List ───────────────────────────────────────────────────────────
.list-container {
  padding: 16px 24px;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--crm-border-hover);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ── Card Columns ───────────────────────────────────────────────────
.contractor-card {
  display: flex;
  align-items: center;
  gap: 16px; // Расстояние между колонками
  padding: 10px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

// Общие стили для колонок
.col {
  display: flex;
  align-items: center;
}

// 1. Инфо (Имя + Заметка)
.col--info {
  flex: 1; // Занимает всё свободное место
  min-width: 0; // Позволяет тексту сжиматься
}

.row-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: var(--crm-text-sm);
  flex-shrink: 0;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: var(--crm-text-md);
  color: var(--crm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

// 2. Тип
.col--type {
  width: 80px; // Фиксированная ширина колонки типа
  flex-shrink: 0;
  justify-content: center;
}

.type-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  text-transform: capitalize;
  text-align: center;
  display: inline-block;

  &--master {
    background: rgba(245, 166, 35, .15);
    color: #f5a623;
  }

  &--worker {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--foreman {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--office {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
}

// 3. Привязка
.col--link {
  width: 30px; // Фиксированная ширина под иконку
  flex-shrink: 0;
  justify-content: center;
}

.user-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--crm-success-dim);
  color: var(--crm-success);
}

.no-user {
  color: var(--crm-text-disabled);
  font-size: var(--crm-text-xs);
}

// 4. Баланс
.col--balance {
  width: 90px; // Фиксированная ширина для сумм
  flex-shrink: 0;
  justify-content: flex-end; // Текст прижат вправо
}

.balance-value {
  font-family: var(--crm-font-mono);
  font-size: var(--crm-text-md);
  font-weight: 700;

  &--positive {
    color: var(--crm-success);
  }

  &--negative {
    color: var(--crm-danger);
  }

  &--neutral {
    color: var(--crm-text-muted);
  }
}

// 5. Действия
.col--actions {
  width: 32px; // Фиксированная ширина кнопки
  flex-shrink: 0;
  justify-content: flex-end;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }
}

// ── Type Select Modal ───────────────────────────────────────────────
.type-select {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__hint {
    font-size: var(--crm-text-md);
    color: var(--crm-text-secondary);
    text-align: center;
    margin: 0;
  }

  &__buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-text-secondary);
  cursor: pointer;
  transition: var(--crm-transition);

  span {
    font-size: var(--crm-text-sm);
    font-weight: 500;
  }

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

// ── Delete Modal ───────────────────────────────────────────────────
.delete-confirm {
  text-align: center;

  p {
    margin: 0 0 8px;
  }

  .delete-warning {
    color: var(--crm-warning);
    font-size: var(--crm-text-xs);
    margin-bottom: 16px;
  }

  .confirm-actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}

// ── Buttons ────────────────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  cursor: pointer;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  transition: var(--crm-transition);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: rgba(242, 95, 92, 0.25);
    }
  }

  &--sm {
    padding: 5px 10px;
    font-size: var(--crm-text-xs);
  }
}

// ── Responsive ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .list-controls {
    padding: 12px 16px;
  }

  .search-box {
    max-width: 100%;
  }

  .list-container {
    padding: 12px 16px;
  }

  .contractor-card {
    flex-wrap: wrap;
    gap: 10px;
    // На мобильных можно немного изменить порядок или ширину, 
    // но пока оставим как есть для консистентности
  }

  .type-select__buttons {
    grid-template-columns: 1fr;
  }
}
</style>