<!-- app\pages\cabinet\admin\contractors\[type]\index.vue -->
 <!-- Страница контрагентов по типу -->
<template>
  <div class="contractors-page">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle 
      :title="getTypeLabel(type)" 
      :icon="getTypeIcon(type)"
    >
      <template #actions>
        <button class="crm-btn crm-btn--accent" @click="openAddModal">
          <Icon name="mdi:plus" size="15" />
          Добавить
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <!-- Контент -->
    <div class="contractors-page__content">
      <!-- ✅ Исправить имя компонента -->
      <PagesCabinetContractorsContractorList 
        :type="type"
        :loading="loading"
        :error="error"
        @add-contractor="openAddModal"
        @retry="loadContractors"
      />
    </div>

    <!-- Модальное окно -->
    <!-- ✅ Исправить имя компонента -->
    <PagesCabinetContractorsContractorModal 
      :is-open="showModal"
      :type="type"
      :contractor="editingContractor"
      :available-users="availableUsers"
      :show-user-select="true"
      @close="closeModal"
      @contractor-created="handleCreated"
      @contractor-updated="handleUpdated"
    />

  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { createError, useRoute } from 'nuxt/app'
import { ref, computed, onMounted } from 'vue'
import { useContractors } from '~/composables/useContractors'
import type { ContractorType, ContractorDTO } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

// ── Meta ───────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ── Маршруто ───────────────────────────────────────────────────────
const route = useRoute()
const type = computed(() => route.params.type as ContractorType)

// Валидация типа
if (!CONTRACTOR_TYPES.includes(type.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Контрагент не найден' })
}

// ── Состояние ──────────────────────────────────────────────────────
const { fetchAll } = useContractors()
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const editingContractor = ref<ContractorDTO | null>(null)
const availableUsers = ref<Array<{ id: number; name: string; login: string }>>([])

// ── Вспомогательные функции ─────────────────────────────────────────
function getTypeLabel(type: ContractorType): string {
  const labels: Record<ContractorType, string> = {
    master: 'Мастера',
    worker: 'Рабочие',
    foreman: 'Прорабы',
    office: 'Офисы'
  }
  return labels[type] || type
}

function getTypeIcon(type: ContractorType): string {
  const icons: Record<ContractorType, string> = {
    master: 'mdi:hammer',
    worker: 'mdi:wrench',
    foreman: 'mdi:clipboard-check',
    office: 'mdi:office-building'
  }
  return icons[type] || 'mdi:account'
}

// ── Загрузка данных ────────────────────────────────────────────────
async function loadContractors() {
  loading.value = true
  error.value = null
  try {
    await fetchAll(type.value)
  } catch (err: any) {
    error.value = err?.message || 'Ошибка загрузки контрагентов'
    console.error('[Contractors] Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  try {
    const response = await $fetch('/api/users', { method: 'GET' })
    availableUsers.value = Array.isArray(response) ? response : []
  } catch (err) {
    console.error('[Contractors] Ошибка загрузки пользователей:', err)
  }
}

// ── Управление модалью ───────���────────────────────────────────────
function openAddModal() {
  editingContractor.value = null
  showModal.value = true
}

function closeModal() {
  editingContractor.value = null
  showModal.value = false
}

function handleCreated(contractor: ContractorDTO) {
  // Уведомление об успехе можно добавить
  closeModal()
}

function handleUpdated(contractor: ContractorDTO) {
  // Уведомление об успехе можно добавить
  closeModal()
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => {
  loadContractors()
  loadUsers()
})
</script>

<style lang="scss" scoped>
.contractors-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.contractors-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  flex: 1;
}

// ── Кнопка добавления ────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  border: none;
  white-space: nowrap;

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}

// ── Responsive ────────────────────────────────────────────────────
@media (max-width: 700px) {
  .contractors-page__content {
    padding: 16px;
  }
}
</style>
