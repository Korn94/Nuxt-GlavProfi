<template>
  <div class="block">
    <h3>Материалы ({{ materials.length }})</h3>

    <!-- Форма добавления/редактирования -->
    <div class="material-form">
      <input 
        v-model="currentMaterial.name" 
        placeholder="Название материала" 
        class="form-control" 
        :class="{ error: !currentMaterial.name }"
        required
      />
      <input 
        v-model.number="currentMaterial.amount" 
        type="number" 
        step="0.01"
        placeholder="Сумма" 
        class="form-control" 
        :class="{ error: !currentMaterial.amount }"
        required
      />
      <textarea 
        v-model="currentMaterial.comment" 
        placeholder="Комментарий" 
        class="form-control"
      ></textarea>
      <div class="form-check">
        <input 
          type="checkbox" 
          v-model="currentMaterial.has_receipt" 
          class="form-check-input"
        >
        <label class="form-check-label">Наличие чека</label>
      </div>
      <div class="buttons">
        <button 
          @click="saveMaterial" 
          :disabled="!isFormValid" 
          class="btn btn-primary"
        >
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </button>
        <button 
          v-if="isEditing" 
          @click="cancelEdit" 
          class="btn btn-secondary"
        >
          Отмена
        </button>
      </div>
    </div>

    <!-- Таблица материалов -->
    <table>
      <thead>
        <tr>
          <th>Название</th>
          <th>Сумма</th>
          <th>Чек</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="material in materials" :key="material.id">
          <td>{{ material.name }}</td>
          <td>{{ material.amount }} ₽</td>
          <td>
            <input 
              type="checkbox" 
              :checked="material.has_receipt" 
              @click="toggleCheck(material)" 
              disabled 
              class="status-checkbox"
            >
          </td>
          <td>
            <button @click="editMaterial(material)">Редактировать</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const materials = ref([])
const currentMaterial = ref({
  name: '',
  amount: 0,
  comment: '',
  has_receipt: false,
  objectId: route.params.id
})
const isEditing = ref(false)

// Валидация формы
const isFormValid = computed(() => {
  return currentMaterial.value.name && currentMaterial.value.amount > 0
})

// Обновление objectId при изменении route
watch(
  () => route.params.id,
  (newId) => {
    currentMaterial.value.objectId = newId
    fetchMaterials()
  }
)

// Загрузка материалов
async function fetchMaterials() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/materials?objectId=${route.params.id}`
    )
    materials.value = response.data.map(material => ({
      ...material,
      amount: Number(material.amount) // Преобразуем в число
    }))
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error)
  }
}

// Методы для материалов
async function saveMaterial() {
  if (isEditing.value) {
    await updateMaterial()
  } else {
    await addMaterial()
  }
  resetForm()
}

async function addMaterial() {
  try {
    const response = await useNuxtApp().$axios.post('/materials', {
      ...currentMaterial.value,
      objectId: route.params.id
    })
    materials.value.push(response.data)
  } catch (error) {
    console.error('Ошибка добавления материала:', error)
  }
}

async function updateMaterial() {
  try {
    const response = await useNuxtApp().$axios.put(
      `/materials/${currentMaterial.value.id}`,
      currentMaterial.value
    )
    const index = materials.value.findIndex(
      (m) => m.id === currentMaterial.value.id
    )
    if (index !== -1) {
      materials.value.splice(index, 1, response.data)
    }
  } catch (error) {
    console.error('Ошибка обновления материала:', error)
  }
}

function editMaterial(material) {
  currentMaterial.value = { ...material }
  isEditing.value = true
}

function cancelEdit() {
  resetForm()
  isEditing.value = false
}

function resetForm() {
  currentMaterial.value = {
    name: '',
    amount: 0,
    comment: '',
    has_receipt: false,
    objectId: route.params.id
  }
}

async function toggleCheck(material) {
  material.has_receipt = !material.has_receipt
  try {
    await useNuxtApp().$axios.patch(
      `/materials/${material.id}/toggle-check`,
      { has_receipt: material.has_receipt }
    )
  } catch (error) {
    console.error('Ошибка обновления чека:', error)
    material.has_receipt = !material.has_receipt // Откат в случае ошибки
  }
}

// Загрузка данных при монтировании
onMounted(fetchMaterials)
</script>

<style scoped>
.material-form {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-control.error {
  border-color: red;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f8f9fa;
}

.status-checkbox {
  transform: scale(1.2);
  cursor: pointer;
}

.status-checkbox:disabled {
  opacity: 0.5;
}

.block {
  margin-bottom: 40px;
}
</style>