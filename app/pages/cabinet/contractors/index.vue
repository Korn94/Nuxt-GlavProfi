<!-- app/pages/cabinet/contractors/index.vue -->
<template>
  <div class="contractors-all-page">
    <!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
    <PageTitle title="Сотрудники" icon="mdi:account-group" :badge="filteredContractors.length">
      <template #actions>
        <NuxtLink v-if="isAdmin" to="/cabinet/admin/users" class="btn btn--ghost btn--sm">
          <Icon name="mdi:account-cog" size="14" />
          Пользователи
        </NuxtLink>
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
        <button :class="['chip', { 'chip--active': filterType === null }]" @click="filterType = null">Все</button>
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
        <button :class="['chip', 'chip--toggle', 'chip--archive', { 'chip--active': showArchived }]"
          @click="toggleArchived" title="Показать архивных контрагентов">
          <Icon name="mdi:archive-outline" size="12" />
          <span>Архивные</span>
        </button>
        <button v-if="hasActiveFilters" class="chip chip--clear" @click="resetFilters"
          title="Сбросить фильтры">✕</button>
      </div>
    </div>

    <!-- ═══════════════════════════ LIST ═════════════════════════════ -->
    <div class="list-container">
      <div v-if="isLoading" class="state-block"><span class="spinner" /> Загрузка контрагентов...</div>
      <div v-else-if="filteredContractors.length === 0" class="state-block">
        <Icon name="mdi:account-off" size="32" />
        <span>Контрагенты не найдены</span>
      </div>

      <div v-else class="cards-grid">
        <div v-for="c in filteredContractors" :key="`${c.type}-${c.id}`"
          :class="['contractor-card', { 'contractor-card--inactive': !c.isActive }]"
          @click="goToContractor(c.type, c.id)">
          <!-- 1. Имя + Заметка -->
          <div class="col col--info">
            <div class="row-main">
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(c.id) }">{{ getInitials(c.name) }}</div>
              <div class="info">
                <div class="name-row">
                  <span class="name">{{ c.name }}</span>
                  <span v-if="!c.isActive" class="archive-badge">Архив</span>
                </div>
                <span v-if="c.comment" class="comment" :title="c.comment">{{ truncateComment(c.comment) }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Тип контрагента -->
          <div class="col col--type">
            <span :class="['type-badge', `type-badge--${c.type}`]">{{ typeLabels[c.type] }}</span>
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
            <span :class="['balance-value', getBalanceClass(c.balance)]">{{ formatBalance(c.balance) }}</span>
          </div>

          <!-- 5. Действия -->
          <div class="col col--actions" @click.stop>
            <button class="action-btn" :class="{ 'action-btn--inactive': !c.isActive }"
              :title="c.isActive ? 'В архив' : 'Восстановить'" @click="toggleContractorStatus(c)">
              <Icon :name="c.isActive ? 'mdi:archive-arrow-down' : 'mdi:archive-arrow-up'" size="15" />
            </button>
            <button class="action-btn" title="Редактировать" @click="openEditModal(c)">
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

    <!-- ═══════════════════════════ Форма создания / редактирования ═══════════════════════════ -->
    <Modal
      :visible="isFormModalOpen"
      :title="editingContractor ? 'Редактирование' : 'Новый контрагент'"
      size="md"
      @update:visible="closeFormModal"
    >
      <!-- Передаем форму через ref для вызова validate() -->
      <PagesCabinetContractorsContractorForm
        v-if="isFormModalOpen"
        ref="contractorFormRef"
        :type="formType!"
        :contractor="editingContractor"
      />
      
      <!-- ✅ Кнопки действий в футере модалки -->
      <template #footer>
        <button class="btn btn--sm" @click="closeFormModal">Отмена</button>
        <button class="btn btn--sm btn--primary" @click="submitForm" :disabled="isSaving">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </template>
    </Modal>

    <Modal :visible="isDeleteConfirmOpen" title="Подтверждение удаления" size="sm"
      @update:visible="isDeleteConfirmOpen = false">
      <div class="delete-confirm">
        <p>Удалить контрагента <strong>{{ targetContractor?.name }}</strong>?</p>
        <p class="delete-warning">⚠️ Это действие нельзя отменить.</p>
        <div class="confirm-actions">
          <button class="btn btn--sm" @click="isDeleteConfirmOpen = false">Отмена</button>
          <button class="btn btn--sm btn--danger" @click="handleDelete" :disabled="isDeleting">{{ isDeleting ?
            'Удаление...'
            : 'Удалить' }}</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { ref, computed, onMounted, watch } from 'vue'
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
const showArchived = ref(false) // ✅ Показывать архивных
const isAdmin = ref(false)

const isTypeSelectOpen = ref(false)
const isFormModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const formType = ref<ContractorType | null>(null)
const editingContractor = ref<ContractorDTO | null>(null)
const targetContractor = ref<ContractorDTO | null>(null)
const isDeleting = ref(false)
const contractorFormRef = ref<any>(null) // ✅ Ref на компонент формы
const isSaving = ref(false) // ✅ Состояние загрузки при сохранении

// ── Types config ─────────────────────────────────────────────────────
const contractorTypes = [
  { value: 'master', label: 'Мастер', icon: 'mdi:hammer' },
  { value: 'worker', label: 'Рабочий', icon: 'mdi:wrench' },
  { value: 'foreman', label: 'Прораб', icon: 'mdi:clipboard-check' },
  { value: 'office', label: 'Офис', icon: 'mdi:office-building' }
] as const

const typeLabels: Record<ContractorType, string> = { master: 'Мастер', worker: 'Рабочий', foreman: 'Прораб', office: 'Офис' }

// ── Unified list ─────────────────────────────────────────────────────
const allContractors = computed(() =>
  CONTRACTOR_TYPES.flatMap(type => contractorsStore.getByType(type).map(c => ({ ...c, type })))
)

// ── Filtering ────────────────────────────────────────────────────────
const filteredContractors = computed(() => {
  let list = allContractors.value

  if (filterType.value) list = list.filter(c => c.type === filterType.value)
  if (onlyWithUser.value) list = list.filter(c => c.userId !== null)
  if (!showArchived.value) list = list.filter(c => c.isActive) // ✅ По умолчанию скрываем архив

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

const hasActiveFilters = computed(() => filterType.value !== null || onlyWithUser.value || searchQuery.value.trim() !== '' || showArchived.value)

function resetFilters() { filterType.value = null; onlyWithUser.value = false; searchQuery.value = ''; showArchived.value = false; reloadWithFilters() }
function toggleArchived() { showArchived.value = !showArchived.value; console.log(`[Contractors] 🔘 Архивные: ${showArchived.value ? 'включены' : 'выключены'}`) }

// ── Helpers ──────────────────────────────────────────────────────────
function getInitials(name: string): string { return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?' }
function getAvatarColor(id: number): string { const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c']; return colors[id % colors.length] || '#00c3f5' }
function truncateComment(text: string, maxLen = 40): string { return text.length > maxLen ? text.slice(0, maxLen) + '…' : text }
function formatBalance(val: string | number | null): string { const num = typeof val === 'string' ? parseFloat(val) : (val || 0); return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num) }
function getBalanceClass(val: string | number | null): string { const num = typeof val === 'string' ? parseFloat(val) : (val || 0); if (num > 0) return 'balance-value--positive'; if (num < 0) return 'balance-value--negative'; return 'balance-value--neutral' }

// ── Navigation ───────────────────────────────────────────────────────
function goToContractor(type: ContractorType, id: number) { router.push(`/cabinet/contractors/${type}/${id}`) }

// ── Modals ───────────────────────────────────────────────────────────
function openTypeSelectModal() { isTypeSelectOpen.value = true }
function startCreate(type: ContractorType) { isTypeSelectOpen.value = false; formType.value = type; editingContractor.value = null; isFormModalOpen.value = true }
function openEditModal(c: ContractorDTO) { formType.value = c.type; editingContractor.value = { ...c }; isFormModalOpen.value = true }

// ── Modals: Form ─────────────────────────────────────────────────────
function closeFormModal() {
  isFormModalOpen.value = false
  editingContractor.value = null
  formType.value = null
  isSaving.value = false
}

// ── Actions ──────────────────────────────────────────────────────────
async function handleSave(formData: any) {
  if (!formType.value) return
  try {
    if (editingContractor.value) await contractorsStore.update(formType.value, editingContractor.value.id, formData)
    else await contractorsStore.create(formType.value, formData)
    closeFormModal()
  } catch (err: any) { console.error('❌ Ошибка сохранения:', err.message) }
}

async function toggleContractorStatus(c: ContractorDTO) {
  try {
    console.log(`[Contractors] 🔄 Переключение статуса: ${c.name} (${c.isActive ? 'В архив' : 'Восстановление'})`)
    await contractorsStore.update(c.type, c.id, { isActive: !c.isActive })
    console.log(`✅ Статус контрагента "${c.name}" успешно изменен`)
  } catch (err: any) { console.error('❌ Ошибка изменения статуса:', err.message) }
}

async function submitForm() {
  if (!contractorFormRef.value) return
  
  // 1. Валидация через дочерний компонент
  if (!contractorFormRef.value.validate()) {
    console.warn('[Contractors] ⚠️ Валидация формы не пройдена')
    return
  }

  isSaving.value = true
  try {
    const formData = contractorFormRef.value.form // Получаем данные из формы
    
    if (editingContractor.value) {
      // Режим редактирования
      await contractorsStore.update(editingContractor.value.type, editingContractor.value.id, formData)
      console.log('✅ Контрагент успешно обновлен')
    } else {
      // Режим создания
      if (!formType.value) throw new Error('Не указан тип контрагента')
      await contractorsStore.create(formType.value, formData)
      console.log('✅ Контрагент успешно создан')
    }
    closeFormModal()
  } catch (err: any) {
    console.error('❌ Ошибка сохранения:', err.message)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!targetContractor.value) return
  isDeleting.value = true
  try {
    await contractorsStore.deleteContractor(targetContractor.value.type, targetContractor.value.id)
    isDeleteConfirmOpen.value = false
    targetContractor.value = null
    console.log('✅ Контрагент успешно удален')
  } catch (err: any) { console.error('❌ Ошибка удаления:', err.message) } finally { isDeleting.value = false }
}

// ── Reload helper ────────────────────────────────────────────────────
async function reloadWithFilters() {
  isLoading.value = true
  try {
    // Загружаем только активных по умолчанию, или всех если включен архив
    await Promise.all(CONTRACTOR_TYPES.map(t => contractorsStore.fetchAll(t, !showArchived.value)))
    console.log(`[Contractors] 📦 Список обновлен (архивные: ${showArchived.value ? 'включены' : 'скрыты'})`)
  } catch (err) { console.error('[Contractors] ❌ Ошибка загрузки:', err) } finally { isLoading.value = false }
}

// ── Lifecycle ────────────────────────────────────────────────────────
watch(showArchived, reloadWithFilters) // ✅ Перезагружаем список при переключении архива

onMounted(async () => {
  await reloadWithFilters()
  try {
    const { user } = await $fetch<{ user: { role: string } }>('/api/me', { credentials: 'include' })
    if (user?.role === 'admin') isAdmin.value = true
  } catch (e) { console.log('[Contractors] ℹ️ Не удалось проверить роль админа') }
})
</script>

<style lang="scss" scoped>
.contractors-all-page {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  padding-bottom: 40px;
}

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

  &--archive {
    &.chip--active {
      background: var(--crm-warning-dim);
      border-color: rgba(245, 166, 35, 0.3);
      color: var(--crm-warning);
    }
  }

  &--clear {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
    padding: 6px 10px;
  }
}

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

.contractor-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }

  &--inactive {
    opacity: 0.65;
    background: var(--crm-bg-elevated);

    .avatar {
      filter: grayscale(1);
      opacity: 0.7;
    }

    .name {
      color: var(--crm-text-muted);
      text-decoration: line-through;
    }
  }
}

.col {
  display: flex;
  align-items: center;
}

.col--info {
  flex: 1;
  min-width: 0;
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

.name-row {
  display: flex;
  align-items: center;
  color: var(--crm-text-primary);
  gap: 8px;
  flex-wrap: wrap;
}

.name {
  font-weight: 600;
  font-size: var(--crm-text-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archive-badge {
  padding: 1px 6px;
  background: var(--crm-warning-dim);
  border: 1px solid rgba(245, 166, 35, 0.3);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--crm-warning);
  text-transform: uppercase;
}

.comment {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  display: block;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col--type {
  width: 80px;
  flex-shrink: 0;
  justify-content: center;
}

.type-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  text-transform: capitalize;

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

.col--link {
  width: 30px;
  flex-shrink: 0;
  justify-content: center;
}

.user-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--crm-success-dim);
  border: 1px solid rgba(61, 214, 140, 0.3);
  border-radius: 50%;
  color: var(--crm-success);
}

.no-user {
  color: var(--crm-text-disabled);
  font-size: var(--crm-text-xs);
  width: 24px;
  text-align: center;
}

.col--balance {
  width: 90px;
  flex-shrink: 0;
  justify-content: flex-end;
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

.col--actions {
  width: 64px;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 4px;
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

  &--inactive {
    color: var(--crm-warning);

    &:hover {
      background: var(--crm-warning-dim);
      border-color: rgba(245, 166, 35, 0.3);
    }
  }
}

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

  &--ghost {
    background: transparent;
    border-color: var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
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

  &--primary {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
    &:hover:not(:disabled) { background: rgba(0, 195, 245, 0.25); }
  }
  &--sm { padding: 5px 10px; font-size: var(--crm-text-xs); }
}

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
  }

  .col--type {
    order: 3;
    width: auto;
  }

  .col--actions {
    margin-left: auto;
  }

  .type-select__buttons {
    grid-template-columns: 1fr;
  }
}
</style>