<!-- app/components/pages/cabinet/Admin/Users/Modals/UserPasswordModal.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="password-form">
    <div class="form-group">
      <label class="form-label" for="new-pass">Новый пароль</label>
      <input id="new-pass" v-model="form.password" type="password" placeholder="Минимум 6 символов" class="input"
        required minlength="6" :disabled="isSubmitting" autofocus />
    </div>

    <div class="form-group">
      <label class="form-label" for="confirm-pass">Подтверждение</label>
      <input id="confirm-pass" v-model="form.confirm" type="password" placeholder="Повторите пароль" class="input"
        required minlength="6" :disabled="isSubmitting" />
    </div>

    <div v-if="localError" class="error-msg">
      <Icon name="mdi:alert-circle" size="14" />
      {{ localError }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn" @click="$emit('close')" :disabled="isSubmitting">Отмена</button>
      <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
        {{ isSubmitting ? 'Сохранение...' : 'Сменить пароль' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from 'stores/users'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  save: [newPassword: string]
  close: []
}>()

const isSubmitting = ref(false)
const localError = ref('')
const form = ref({
  password: '',
  confirm: ''
})

// Сброс формы при открытии нового пользователя
watch(() => props.user, () => {
  form.value = { password: '', confirm: '' }
  localError.value = ''
  isSubmitting.value = false
  console.log('[UserPasswordModal] 🟢 Форма смены пароля готова')
}, { immediate: true })

function handleSubmit() {
  localError.value = ''

  if (form.value.password.length < 6) {
    localError.value = 'Пароль должен содержать минимум 6 символов'
    return
  }
  if (form.value.password !== form.value.confirm) {
    localError.value = 'Пароли не совпадают'
    return
  }

  isSubmitting.value = true
  console.log(`[UserPasswordModal] 🟡 Отправка смены пароля для ${props.user?.login}`)
  emit('save', form.value.password)
}
</script>

<style lang="scss" scoped>
.password-form {
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