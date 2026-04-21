<!-- app/components/pages/cabinet/Admin/Users/Modals/UserFormModal.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="user-form">
    <div class="form-group">
      <label class="form-label" for="user-name">Имя</label>
      <input id="user-name" v-model="form.name" type="text" placeholder="Иванов Иван" class="input" required
        :disabled="isSubmitting" />
    </div>

    <div class="form-group">
      <label class="form-label" for="user-login">Логин</label>
      <input id="user-login" v-model="form.login" type="text" placeholder="ivanov_ii" class="input" required
        :disabled="isSubmitting" />
    </div>

    <div class="form-group">
      <label class="form-label" for="user-role">Роль</label>
      <select id="user-role" v-model="form.role" class="input select" :disabled="isSubmitting">
        <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
    </div>

    <div class="form-group password-group">
      <label class="form-label checkbox-label">
        <input type="checkbox" v-model="form.changePassword" :disabled="isSubmitting" class="form-checkbox" />
        <span>Сменить пароль</span>
      </label>

      <input v-if="form.changePassword || !props.user" v-model="form.password" type="password"
        placeholder="Минимум 6 символов" class="input" :required="!props.user || form.changePassword" minlength="6"
        :disabled="isSubmitting" />
      <p v-else class="input-hint">Пароль не будет изменён. Отметьте галочку для смены.</p>
    </div>

    <!-- === Блок привязки к контрагенту === -->
    <div class="form-group contractor-group">
      <label class="form-label">Привязка к контрагенту</label>
      
      <!-- Тип контрагента -->
      <select 
        v-model="contractorType" 
        class="input select" 
        :disabled="isSubmitting"
        @change="onContractorTypeChange"
      >
        <option :value="null">— Не привязан —</option>
        <option value="master">Мастер</option>
        <option value="worker">Рабочий</option>
        <option value="foreman">Прораб</option>
        <option value="office">Офис</option>
      </select>
      
      <!-- Список контрагентов (подгружается по типу) -->
      <select 
        v-if="contractorType" 
        v-model="contractorId" 
        class="input select" 
        :disabled="isSubmitting || contractorsLoading"
      >
        <option :value="null">— Выбрать —</option>
        <option 
          v-for="c in contractorsList" 
          :key="c.id" 
          :value="c.id"
        >
          {{ c.name }} {{ c.balance ? `(${formatBalance(c.balance)})` : '' }}
        </option>
      </select>
      
      <!-- Кнопка отвязки (если уже привязан) -->
      <button 
        v-if="initialContractorId" 
        type="button" 
        class="btn btn--sm btn--danger" 
        @click="unlinkContractor"
        :disabled="isSubmitting"
      >
        ✕ Отвязать
      </button>
      
      <p v-if="contractorsError" class="error-hint">{{ contractorsError }}</p>
    </div>

    <div v-if="localError" class="error-msg">
      <Icon name="mdi:alert-circle" size="14" />
      {{ localError }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn" @click="$emit('close')" :disabled="isSubmitting">Отмена</button>
      <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
        {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { User } from 'stores/users'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  save: [formData: Partial<User> & { 
    password?: string,
    contractorType?: string | null,
    contractorId?: number | null
  }]
  close: []
}>()

// ── Состояние формы ────────────────────────────────────────────────
const isSubmitting = ref(false)
const localError = ref('')

const form = ref({
  name: '',
  login: '',
  role: 'worker' as User['role'],
  password: '',
  changePassword: false
})

const roles = [
  { label: 'Админ', value: 'admin' },
  { label: 'Менеджер', value: 'manager' },
  { label: 'Прораб', value: 'foreman' },
  { label: 'Мастер', value: 'master' },
  { label: 'Рабочий', value: 'worker' }
]

// ── Привязка к контрагенту ─────────────────────────────────────────
const contractorType = ref<'master' | 'worker' | 'foreman' | 'office' | null>(null)
const contractorId = ref<number | null>(null)
const initialContractorId = ref<number | null>(null) // для кнопки "Отвязать"

const contractorsList = ref<any[]>([])
const contractorsLoading = ref(false)
const contractorsError = ref('')

// Форматирование баланса
function formatBalance(val: string | number | null) {
  if (val === null || val === undefined) return ''
  const num = typeof val === 'string' ? parseFloat(val) : val
  return new Intl.NumberFormat('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(num || 0)
}

// Загрузка контрагентов по типу
async function fetchContractors(type: 'master' | 'worker' | 'foreman' | 'office') {
  if (!type) return
  contractorsLoading.value = true
  contractorsError.value = ''
  try {
    const { contractors } = await $fetch<{ contractors: any[] }>(`/api/contractors/${type}`)
    contractorsList.value = contractors || []
    console.log(`[UserForm] 📦 Загружено ${contractorsList.value.length} контрагентов типа "${type}"`)
  } catch (err: any) {
    contractorsError.value = 'Не удалось загрузить список'
    console.error('[UserForm] Ошибка загрузки контрагентов:', err)
  } finally {
    contractorsLoading.value = false
  }
}

// Обработчик смены типа контрагента
function onContractorTypeChange() {
  contractorId.value = null
  if (contractorType.value) {
    fetchContractors(contractorType.value)
  } else {
    contractorsList.value = []
  }
}

// Отвязка контрагента
function unlinkContractor() {
  contractorType.value = null
  contractorId.value = null
  contractorsList.value = []
  console.log('[UserForm] 🔗 Контрагент отвязан')
}

// ── Инициализация формы при открытии модалки ───────────────────────
function initForm() {
  localError.value = ''
  if (props.user) {
    // Режим редактирования
    form.value.name = props.user.name
    form.value.login = props.user.login
    form.value.role = props.user.role
    form.value.password = ''
    form.value.changePassword = false
    
    // ✅ Заполняем привязку к контрагенту
    contractorType.value = (props.user as any).contractorType || null
    contractorId.value = (props.user as any).contractorId || null
    initialContractorId.value = (props.user as any).contractorId || null
    
    // Загружаем список контрагентов, если тип задан
    if (contractorType.value) {
      fetchContractors(contractorType.value)
    }
    
    console.log('[UserFormModal] 🟢 Режим редактирования:', props.user.login)
  } else {
    // Режим создания — чистая форма
    form.value.name = ''
    form.value.login = ''
    form.value.role = 'worker'
    form.value.password = ''
    form.value.changePassword = false
    contractorType.value = null
    contractorId.value = null
    initialContractorId.value = null
    contractorsList.value = []
    console.log('[UserFormModal] 🟢 Режим создания')
  }
}

// Синхронизация при изменении пропса (когда открывают разных пользователей подряд)
watch(() => props.user, initForm, { immediate: true })

// ── Валидация и отправка ───────────────────────────────────────────
function handleSubmit() {
  localError.value = ''

  // Простая валидация
  if (!form.value.name.trim()) {
    localError.value = 'Укажите имя пользователя'
    return
  }
  if (!form.value.login.trim()) {
    localError.value = 'Укажите логин'
    return
  }
  if (!props.user && !form.value.password.trim()) {
    localError.value = 'Пароль обязателен при создании'
    return
  }
  if (form.value.changePassword && form.value.password.trim().length < 6) {
    localError.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  isSubmitting.value = true
  console.log('[UserFormModal] 🟡 Отправка формы...')

  const payload: Partial<User> & { 
    password?: string,
    contractorType?: string | null,
    contractorId?: number | null
  } = {
    name: form.value.name.trim(),
    login: form.value.login.trim(),
    role: form.value.role,
    // ✅ Привязка к контрагенту
    contractorType: contractorType.value,
    contractorId: contractorId.value
  }

  // Передаём пароль только если режим создания или включена смена
  if (!props.user || form.value.changePassword) {
    payload.password = form.value.password
  }

  emit('save', payload)
  // isSubmitting сбросится в родительском компоненте после успеха/ошибки
}

// Сброс состояния загрузки при закрытии (на случай если родитель не успел)
watch(() => props.user, (val) => {
  if (val === null && !props.user) {
    isSubmitting.value = false
  }
})
</script>

<style lang="scss" scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-secondary);
}

.input {
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-md);
  transition: var(--crm-transition);
  outline: none;

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239aa0b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox {
  accent-color: var(--crm-accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.input-hint {
  margin: 0;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-style: italic;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: var(--crm-radius-md);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--crm-border);
}

.contractor-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
  
  .select {
    width: 100%;
  }
  
  .btn--danger {
    align-self: flex-start;
    margin-top: 4px;
  }
}

.error-hint {
  margin: 0;
  font-size: var(--crm-text-xs);
  color: var(--crm-danger);
}

// Кнопки наследуют стили из users.vue, но добавим базовые fallback
.btn {
  padding: 8px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  cursor: pointer;
  font-size: var(--crm-text-sm);
  transition: var(--crm-transition);

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
}
</style>