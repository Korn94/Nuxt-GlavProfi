<!-- app/pages/cabinet/partners/index.vue -->
<template>
  <div class="partners-all-page">
    <PageTitle title="Партнёры" icon="mdi:handshake-outline" :badge="filteredPartners.length">
      <template #actions>
        <button class="btn btn--primary btn--sm" @click="openCreateModal">
          <Icon name="mdi:plus" size="14" />
          Добавить партнёра
        </button>
      </template>
    </PageTitle>

    <!-- Фильтры -->
    <div class="list-controls">
      <div class="search-box">
        <Icon name="mdi:magnify" size="16" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Поиск по компании, контакту или логину..." class="input search-input" autocomplete="off" />
      </div>
      <div class="filter-chips">
        <button :class="['chip', 'chip--toggle', { 'chip--active': onlyWithUser }]" @click="onlyWithUser = !onlyWithUser" title="Показать только с привязанным аккаунтом">
          <Icon name="mdi:account-check" size="12" />
          <span>С аккаунтом</span>
        </button>
        <button :class="['chip', 'chip--toggle', 'chip--archive', { 'chip--active': showArchived }]" @click="showArchived = !showArchived" title="Показать архивных партнёров">
          <Icon name="mdi:archive-outline" size="12" />
          <span>Архивные</span>
        </button>
        <button v-if="hasActiveFilters" class="chip chip--clear" @click="resetFilters" title="Сбросить фильтры">✕</button>
      </div>
    </div>

    <!-- Список -->
    <div class="list-container">
      <div v-if="isLoading" class="state-block"><span class="spinner" /> Загрузка партнёров...</div>
      <div v-else-if="filteredPartners.length === 0" class="state-block">
        <Icon name="mdi:account-off" size="32" />
        <span>Партнёры не найдены</span>
      </div>

      <div v-else class="cards-grid">
        <div v-for="p in filteredPartners" :key="p.id"
          :class="['partner-card', { 'partner-card--inactive': !p.isActive }]"
          @click="goToPartner(p.id)">
          <div class="col col--info">
            <div class="row-main">
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(p.id) }">{{ getInitials(displayName(p)) }}</div>
              <div class="info">
                <div class="name-row">
                  <span class="name">{{ displayName(p) }}</span>
                  <span v-if="!p.isActive" class="archive-badge">Архив</span>
                </div>
                <span v-if="p.contactPerson && p.companyName" class="comment" :title="p.contactPerson">{{ truncate(p.contactPerson) }}</span>
                <span v-else-if="p.comment" class="comment" :title="p.comment">{{ truncate(p.comment) }}</span>
              </div>
            </div>
          </div>

          <div class="col col--type">
            <span class="leads-badge">Сделок: {{ p.leadsCount ?? 0 }}</span>
          </div>

          <div class="col col--link">
            <span v-if="p.login" class="user-icon" :title="`Привязан: @${p.login}`">
              <Icon name="mdi:account-check" size="14" />
            </span>
            <span v-else class="no-user" title="Без аккаунта">—</span>
          </div>

          <div class="col col--actions" @click.stop>
            <button class="action-btn" :class="{ 'action-btn--inactive': !p.isActive }"
              :title="p.isActive ? 'В архив' : 'Восстановить'" @click="toggleArchive(p)">
              <Icon :name="p.isActive ? 'mdi:archive-arrow-down' : 'mdi:archive-arrow-up'" size="15" />
            </button>
            <button class="action-btn" title="Редактировать" @click="openEditModal(p)">
              <Icon name="mdi:pencil" size="15" />
            </button>
            <button class="action-btn action-btn--danger" title="Удалить" @click="openDeleteConfirm(p)">
              <Icon name="mdi:delete" size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка создания/редактирования -->
    <Modal :visible="isModalOpen" :title="modalTitle" size="md" @update:visible="closeModal">
      <form @submit.prevent="savePartner" class="partner-form">
        <div class="field-row">
          <label class="field">
            <span>Название компании</span>
            <input v-model="form.companyName" type="text" class="input" />
          </label>
          <label class="field">
            <span>Контактное лицо</span>
            <input v-model="form.contactPerson" type="text" class="input" />
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Телефон</span>
            <input v-model="form.phone" type="text" class="input" />
          </label>
          <label class="field">
            <span>Email</span>
            <input v-model="form.email" type="text" class="input" />
          </label>
        </div>
        <label class="field">
          <span>Комментарий</span>
          <textarea v-model="form.comment" rows="2" class="input" />
        </label>

        <!-- Связь с аккаунтом (только при создании) -->
        <template v-if="!editingPartner">
          <div class="account-section">
            <span class="account-section__label">Аккаунт для входа</span>
            <div class="account-modes">
              <label class="radio-label"><input v-model="accountMode" type="radio" value="none" /> Без аккаунта</label>
              <label class="radio-label"><input v-model="accountMode" type="radio" value="create" /> Создать аккаунт</label>
              <label class="radio-label"><input v-model="accountMode" type="radio" value="link" /> Привязать существующий</label>
            </div>
          </div>

          <template v-if="accountMode === 'create'">
            <div class="field-row">
              <label class="field">
                <span>Имя пользователя</span>
                <input v-model="form.name" type="text" class="input" />
              </label>
              <label class="field">
                <span>Логин</span>
                <input v-model="form.login" type="text" class="input" />
              </label>
            </div>
            <label class="field">
              <span>Пароль (мин. 6 символов)</span>
              <input v-model="form.password" type="password" class="input" />
            </label>
          </template>

          <label v-if="accountMode === 'link'" class="field">
            <span>Пользователь</span>
            <select v-model="form.linkUserId" class="input select" :disabled="linkUsersLoading">
              <option :value="null">— Выбрать —</option>
              <option v-for="u in linkUsers" :key="u.id" :value="u.id">
                {{ u.name }} (@{{ u.login }})
              </option>
            </select>
          </label>
        </template>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
      <template #footer>
        <button class="btn btn--sm" @click="closeModal">Отмена</button>
        <button class="btn btn--sm btn--primary" @click="savePartner" :disabled="isSubmitting">
          {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </template>
    </Modal>

    <!-- Подтверждение удаления -->
    <Modal :visible="isDeleteOpen" title="Подтверждение удаления" size="sm" @update:visible="isDeleteOpen = false">
      <div class="delete-confirm">
        <p>Удалить партнёра <strong>{{ targetPartner ? displayName(targetPartner) : '...' }}</strong> и все его сделки?</p>
        <p class="delete-warning">⚠️ Это действие нельзя отменить.</p>
        <div class="confirm-actions">
          <button class="btn btn--sm" @click="isDeleteOpen = false">Отмена</button>
          <button class="btn btn--sm btn--danger" @click="handleDelete" :disabled="isDeleting">{{ isDeleting ? 'Удаление...' : 'Удалить' }}</button>
        </div>
      </div>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageTitle from '~/components/pages/Cabinet/ui/layout/PageTitle.vue'
import Modal from '~/components/pages/Cabinet/ui/Modal.vue'
import { useApi } from '~/composables/useApi'
import { useNotifications } from '~/composables/useNotifications'
import type { Partner } from '~/types/partners'
import type { User } from 'stores/users'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'],
})

const router = useRouter()
const api = useApi()
const notifications = useNotifications()

const isLoading = ref(true)
const partners = ref<Partner[]>([])
const searchQuery = ref('')
const onlyWithUser = ref(false)
const showArchived = ref(false)

const filteredPartners = computed(() => {
  let list = partners.value
  if (!showArchived.value) list = list.filter(p => p.isActive)
  if (onlyWithUser.value) list = list.filter(p => p.userId !== null && p.userId !== undefined)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p =>
      (p.companyName || '').toLowerCase().includes(q) ||
      (p.contactPerson || '').toLowerCase().includes(q) ||
      (p.login || '').toLowerCase().includes(q)
    )
  }
  return list
})

const hasActiveFilters = computed(() => onlyWithUser.value || showArchived.value || searchQuery.value.trim() !== '')

function resetFilters() {
  onlyWithUser.value = false
  showArchived.value = false
  searchQuery.value = ''
}

function displayName(p: { companyName?: string | null; contactPerson?: string | null }): string {
  return p.companyName || p.contactPerson || 'Партнёр'
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?'
}

function getAvatarColor(id: number): string {
  const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c', '#8e44ad']
  return colors[id % colors.length] || '#00c3f5'
}

function truncate(text: string, maxLen = 40): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

function goToPartner(id: number) {
  router.push(`/cabinet/partners/${id}`)
}

const isModalOpen = ref(false)
const editingPartner = ref<Partner | null>(null)
const isSubmitting = ref(false)
const error = ref('')
const accountMode = ref<'none' | 'create' | 'link'>('none')
const linkUsers = ref<User[]>([])
const linkUsersLoading = ref(false)

const emptyForm = () => ({
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  comment: '',
  name: '',
  login: '',
  password: '',
  linkUserId: null as number | null,
})
const form = ref(emptyForm())

const modalTitle = computed(() => (editingPartner.value ? 'Редактировать партнёра' : 'Новый партнёр'))

async function fetchLinkUsers() {
  linkUsersLoading.value = true
  try {
    const res = await api.get<{ users: User[] }>('/api/users')
    linkUsers.value = (res?.users || []).filter(u => u.role === 'partner' && !u.partnerId)
  } catch (e) {
    console.error('Ошибка загрузки пользователей для привязки:', e)
  } finally {
    linkUsersLoading.value = false
  }
}

function openCreateModal() {
  editingPartner.value = null
  form.value = emptyForm()
  accountMode.value = 'none'
  error.value = ''
  isModalOpen.value = true
  fetchLinkUsers()
}

function openEditModal(p: Partner) {
  editingPartner.value = p
  form.value = {
    companyName: p.companyName || '',
    contactPerson: p.contactPerson || '',
    phone: p.phone || '',
    email: p.email || '',
    comment: p.comment || '',
    name: '',
    login: '',
    password: '',
    linkUserId: null,
  }
  accountMode.value = 'none'
  error.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingPartner.value = null
}

async function savePartner() {
  if (isSubmitting.value) return
  error.value = ''
  if (!form.value.companyName.trim() && !form.value.contactPerson.trim()) {
    error.value = 'Укажите название компании или контактное лицо'
    return
  }
  if (accountMode.value === 'link' && !form.value.linkUserId) {
    error.value = 'Выберите пользователя для привязки'
    return
  }

  isSubmitting.value = true
  try {
    if (editingPartner.value) {
      await api.put(`/api/partners/${editingPartner.value.id}`, {
        companyName: form.value.companyName,
        contactPerson: form.value.contactPerson,
        phone: form.value.phone,
        email: form.value.email,
        comment: form.value.comment,
      })
      notifications.success('Партнёр обновлён')
    } else {
      const payload: Record<string, unknown> = {
        companyName: form.value.companyName,
        contactPerson: form.value.contactPerson,
        phone: form.value.phone,
        email: form.value.email,
        comment: form.value.comment,
      }
      if (accountMode.value === 'create') {
        payload.createUser = true
        payload.name = form.value.name
        payload.login = form.value.login
        payload.password = form.value.password
      } else if (accountMode.value === 'link') {
        payload.userId = form.value.linkUserId
      }
      await api.post('/api/partners', payload)
      notifications.success('Партнёр создан')
    }
    closeModal()
    await loadPartners()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Ошибка сохранения'
  } finally {
    isSubmitting.value = false
  }
}

// ── Архивация/восстановление ────────────────────────────────────────
async function toggleArchive(p: Partner) {
  try {
    await api.put(`/api/partners/${p.id}`, { isActive: !p.isActive })
    notifications.success(p.isActive ? 'Партнёр перемещён в архив' : 'Партнёр восстановлен')
    await loadPartners()
  } catch (e: any) {
    notifications.error(e?.data?.statusMessage || 'Ошибка изменения статуса')
  }
}

// ── Удаление ────────────────────────────────────────────────────────
const isDeleteOpen = ref(false)
const targetPartner = ref<Partner | null>(null)
const isDeleting = ref(false)

function openDeleteConfirm(p: Partner) {
  targetPartner.value = p
  isDeleteOpen.value = true
}

async function handleDelete() {
  if (!targetPartner.value) return
  isDeleting.value = true
  try {
    await api.delete(`/api/partners/${targetPartner.value.id}`)
    notifications.success('Партнёр удалён')
    isDeleteOpen.value = false
    targetPartner.value = null
    await loadPartners()
  } catch (e: any) {
    notifications.error(e?.data?.statusMessage || 'Ошибка удаления')
  } finally {
    isDeleting.value = false
  }
}

// ── Загрузка ────────────────────────────────────────────────────────
async function loadPartners() {
  isLoading.value = true
  try {
    const res = await api.get<Partner[]>('/api/partners?includeInactive=true')
    partners.value = res || []
  } catch (e) {
    console.error('Ошибка загрузки партнёров:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPartners)

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Партнёры',
})
</script>

<style lang="scss" scoped>
.partners-all-page {
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

  &--toggle.chip--active {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, 0.3);
    color: var(--crm-success);
  }

  &--archive.chip--active {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);
    color: var(--crm-warning);
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
  to { transform: rotate(360deg); }
}

.partner-card {
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
  gap: 8px;
  flex-wrap: wrap;
  color: var(--crm-text-primary);
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
  width: auto;
  flex-shrink: 0;
  justify-content: center;
}

.leads-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  white-space: nowrap;
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

.col--actions {
  width: auto;
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

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
}

.partner-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input {
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-md);
  outline: none;
  transition: var(--crm-transition);

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &.select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239aa0b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
}

.account-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }
}

.account-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-primary);
  cursor: pointer;

  input {
    accent-color: var(--crm-accent);
    cursor: pointer;
  }
}

.error-msg {
  margin: 0;
  padding: 8px 12px;
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: var(--crm-radius-md);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
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

  .partner-card {
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

  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>




