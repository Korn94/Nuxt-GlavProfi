<template>
  <div class="test-container">
    <h1>🔍 Тест DaData API</h1>

    <div class="form-section">
      <div class="input-group">
        <label>API-токен DaData</label>
        <input
          v-model="token"
          type="password"
          placeholder="Вставьте ваш токен"
          class="form-input"
        />
        <small>Токен хранится только в памяти браузера</small>
      </div>

      <div class="input-group">
        <label>ИНН для проверки</label>
        <input
          v-model="inn"
          type="text"
          placeholder="Например: 622907683792"
          class="form-input"
        />
      </div>

      <button
        @click="checkInn"
        :disabled="loading || !token || !inn"
        class="btn-primary"
      >
        {{ loading ? '⏳ Проверяю...' : '🚀 Проверить в DaData' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">
      ❌ {{ error }}
    </div>

    <div v-if="result" class="result-section">
      <h2>📊 Основная информация</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Название:</span>
          <span class="value">{{ result.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">Статус:</span>
          <span class="value" :class="result.status === 'ACTIVE' ? 'status-active' : 'status-inactive'">
            {{ statusText(result.status) }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">ИНН:</span>
          <span class="value">{{ result.inn }}</span>
        </div>
        <div class="info-item">
          <span class="label">ОГРН:</span>
          <span class="value">{{ result.ogrn }}</span>
        </div>
        <div class="info-item">
          <span class="label">Тип:</span>
          <span class="value">{{ result.type === 'INDIVIDUAL' ? 'ИП' : 'Юрлицо' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Основной ОКВЭД:</span>
          <span class="value">{{ result.okved }} - {{ result.okvedName }}</span>
        </div>
        <div class="info-item full-width">
          <span class="label">Адрес:</span>
          <span class="value">{{ result.address }}</span>
        </div>
        <div class="info-item" v-if="result.registrationDate">
          <span class="label">Дата регистрации:</span>
          <span class="value">{{ formatDate(result.registrationDate) }}</span>
        </div>
      </div>

      <h3>Все ОКВЭДы</h3>
      <div class="okved-list">
        <div v-for="(okved, idx) in result.okveds" :key="idx" class="okved-item">
          <span class="okved-code">{{ okved.code }}</span>
          <span class="okved-name">{{ okved.name }}</span>
          <span v-if="okved.main" class="badge-main">Основной</span>
        </div>
      </div>

      <h3>Сырой JSON (для отладки)</h3>
      <details class="raw-json">
        <summary>Показать полный ответ API</summary>
        <pre>{{ JSON.stringify(rawResponse, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
const token = ref('')
const inn = ref('622907683792') // Подставили ваш ИНН по умолчанию
const loading = ref(false)
const error = ref('')
const result = ref<any>(null)
const rawResponse = ref<any>(null)

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'] 
})

async function checkInn() {
  loading.value = true
  error.value = ''
  result.value = null
  rawResponse.value = null

  try {
    const response = await $fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${token.value}`
      },
      body: { query: inn.value }
    })

    rawResponse.value = response

    if (!response.suggestions || response.suggestions.length === 0) {
      throw new Error('Компания не найдена по указанному ИНН')
    }

    const data = response.suggestions[0].data

    result.value = {
      name: data.name?.full_with_opf || '—',
      status: data.state?.status || 'UNKNOWN',
      inn: data.inn,
      ogrn: data.ogrn,
      type: data.type,
      okved: data.okved || '—',
      okvedName: data.okveds?.find((o: any) => o.main)?.name || '—',
      okveds: data.okveds || [],
      address: data.address?.unrestricted_value || '—',
      registrationDate: data.state?.registration_date
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка при запросе к API'
    console.error('DaData API error:', e)
  } finally {
    loading.value = false
  }
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    'ACTIVE': '✅ Действующий',
    'LIQUIDATING': '⚠️ Ликвидируется',
    'LIQUIDATED': '❌ Ликвидирован',
    'BANKRUPT': '💸 Банкрот',
    'REORGANIZING': '🔄 В процессе реорганизации'
  }
  return map[status] || status
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.test-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 2rem;
  color: #333;
}

h2, h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #444;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 600;
  color: #555;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.input-group small {
  color: #999;
  font-size: 0.85rem;
}

.btn-primary {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  display: block;
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.status-active {
  color: #28a745;
}

.status-inactive {
  color: #dc3545;
}

.okved-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.okved-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #e0e0e0;
}

.okved-item:has(.badge-main) {
  border-left-color: #667eea;
  background: #f0f4ff;
}

.okved-code {
  font-weight: 700;
  color: #667eea;
  min-width: 80px;
}

.okved-name {
  flex: 1;
  color: #555;
}

.badge-main {
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.raw-json {
  margin-top: 1rem;
}

.raw-json summary {
  cursor: pointer;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-weight: 600;
}

.raw-json pre {
  margin-top: 1rem;
  padding: 1rem;
  background: #2d2d2d;
  color: #f8f8f2;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>