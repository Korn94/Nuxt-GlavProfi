<!-- app/components/pages/Cabinet/partner/checkPhone/index.vue -->
<template>
  <div class="pcp">
    <header class="pcp-head">
      <h1 class="pcp-head__title">Проверить клиента</h1>
      <p class="pcp-head__sub">
        Введите полный номер телефона клиента, чтобы узнать, не передан ли он нам ранее.
        Ответ появится только после ввода полного номера.
      </p>
    </header>

    <section class="pcp-card">
      <form class="pcp-form" @submit.prevent="check">
        <label class="pcp-form__label" for="check-phone">Номер телефона клиента</label>
        <div class="pcp-form__row">
          <input
            id="check-phone"
            v-model="phone"
            v-phone-format
            type="tel"
            class="pcp-form__input"
            :class="{ 'pcp-form__input--error': error }"
            placeholder="+7 (900) 000-00-00"
            autocomplete="off"
            @input="resetResult"
          />
          <button type="submit" class="pcp-form__btn" :disabled="!isComplete || isChecking">
            <span v-if="isChecking" class="pcp-spinner" />
            <span v-else>Проверить</span>
          </button>
        </div>
        <p class="pcp-form__hint">Номер вводится полностью — мы не показываем чужие номера.</p>
        <p v-if="error" class="pcp-form__error">{{ error }}</p>
      </form>

      <div v-if="result === 'found'" class="pcp-result pcp-result--found">
        <Icon name="mdi:alert-circle-outline" size="24" class="pcp-result__icon" />
        <div class="pcp-result__body">
          <b>Номер уже есть в базе</b>
          <span>Этот клиент уже передан в ГлавПрофи. Повторная передача невозможна.</span>
        </div>
      </div>

      <div v-else-if="result === 'free'" class="pcp-result pcp-result--free">
        <Icon name="mdi:check-circle-outline" size="24" class="pcp-result__icon" />
        <div class="pcp-result__body">
          <b>Номер свободен</b>
          <span>Такого номера в базе нет — можно передать клиента.</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { useApi } from '~/composables/useApi'

const authStore = useAuthStore()
const api = useApi()

const phone = ref('')
const isChecking = ref(false)
const result = ref<'found' | 'free' | null>(null)
const error = ref('')

const digits = computed(() => phone.value.replace(/\D/g, ''))
const isComplete = computed(() => digits.value.length >= 11)

function resetResult() {
  result.value = null
  error.value = ''
}

async function check() {
  if (!isComplete.value || isChecking.value) return

  isChecking.value = true
  error.value = ''
  result.value = null

  try {
    const data = await api.post<{ found: boolean }>('/api/partner/check-phone', {
      phone: phone.value.trim(),
    })
    result.value = data.found ? 'found' : 'free'
  } catch (err) {
    const e = err as { data?: { statusMessage?: string }; message?: string }
    error.value = e?.data?.statusMessage || e?.message || 'Не удалось проверить номер. Попробуйте позже.'
  } finally {
    isChecking.value = false
  }
}

onMounted(async () => {
  if (authStore.isChecking) {
    await authStore.init().catch(() => {})
  }
  if (authStore.user?.role !== 'partner') {
    await navigateTo('/cabinet')
  }
})
</script>

<style lang="scss" scoped>
$ink: #0f1114;
$surface: #ffffff;
$border: #e5e7eb;
$muted: #8a8f94;
$accent: #00c3f5;
$danger: #dc3545;
$success: #28a745;

.pcp {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pcp-head {
  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $ink;
  }

  &__sub {
    margin: 8px 0 0;
    font-size: 14px;
    color: $muted;
    max-width: 560px;
    line-height: 1.6;
  }
}

.pcp-card {
  background: $surface;
  border: 1px solid $border;
  border-radius: 18px;
  padding: 24px;
}

.pcp-form {
  &__label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: $ink;
    margin-bottom: 8px;
  }

  &__row {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }

  &__input {
    flex: 1 1 260px;
    padding: 13px 15px;
    border: 1px solid #d5d9db;
    border-radius: 11px;
    font: inherit;
    font-size: 16px;
    color: $ink;
    background: #fff;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder { color: #a3a8ac; }

    &:focus {
      outline: none;
      border-color: $accent;
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.15);
    }

    &--error { border-color: $danger; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 130px;
    padding: 13px 22px;
    border-radius: 11px;
    border: 0;
    background: $ink;
    color: #fff;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.15s ease, opacity 0.15s ease;

    &:hover:not(:disabled) { transform: translateY(-1px); }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__hint { margin: 10px 0 0; font-size: 12px; color: $muted; }
  &__error { margin: 10px 0 0; font-size: 13px; color: $danger; }
}

.pcp-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pcp-spin 0.7s linear infinite;
}

@keyframes pcp-spin {
  to { transform: rotate(360deg); }
}

.pcp-result {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: 13px;
  border: 1px solid;

  &__icon { flex-shrink: 0; margin-top: 1px; }

  &__body {
    b { display: block; font-size: 15px; font-weight: 700; }
    span { font-size: 13px; line-height: 1.5; }
  }

  &--found {
    background: #fff1f0;
    border-color: #f2a9a7;
    color: #c62828;

    .pcp-result__icon { color: $danger; }
  }

  &--free {
    background: #f0fbf2;
    border-color: #bfe6c4;
    color: #1e7e34;

    .pcp-result__icon { color: $success; }
  }
}

@media (max-width: 640px) {
  .pcp-head__title { font-size: 24px; }
  .pcp-form__btn { width: 100%; }
}
</style>
