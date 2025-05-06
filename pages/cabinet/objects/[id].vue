<template>
  <div class="object-detail">
    <header class="object-header">
      <h1>{{ object.name }}</h1>
      <div class="object-status">
        <span>Статус: {{ object.status }}</span>
      </div>
    </header>

    <div class="balance-section">
      <h2>Балансы:</h2>
      <div class="balance-item">
        <strong>Объект:</strong> {{ objectBalance }} ₽
        <p>Приходы: {{ totalComings }} ₽</p>
        <p>Расходы: {{ totalExpenses }} ₽</p>
      </div>
      <div class="balance-item">
        <strong>Материалы:</strong> {{ materialsTotal }} ₽
      </div>
    </div>

    <!-- Вкладки -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="{ active: currentTab === tab }"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Содержимое вкладок -->
    <div class="content">
      <!-- Вкладка "Материалы" -->
      <div v-if="currentTab === 'Материалы'">
        <PagesCabinetObjectsMaterials
          :materials="materials"
          :objectId="objectId"
          @add="handleMaterialAdded"
          @update="handleMaterialUpdated"
          @delete="handleMaterialDeleted"
        />
      </div>

      <!-- Вкладка "Операции" -->
      <div v-if="currentTab === 'Операции'">
        <PagesCabinetObjectsOperations
          :object-id="objectId"
          :operations="operations"
          @add-coming="handleComingAdded"
          @add-expense="handleExpenseAdded"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const router = useRouter();
const objectId = route.params.id;

const object = ref({});
const materials = ref([]);
const operations = ref([]);
const currentTab = ref('Материалы');
const tabs = ['Материалы', 'Операции'];

// Вычисляемые свойства для балансов
const objectBalance = computed(() => {
  return (totalComings.value - totalExpenses.value).toFixed(2);
});

const totalComings = computed(() => {
  return operations.value
    .filter(op => op.type === 'coming')
    .reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
});

const totalExpenses = computed(() => {
  return operations.value
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
});

const materialsTotal = computed(() => {
  const incoming = materials.value
    .filter(m => m.type === 'incoming')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const outgoing = materials.value
    .filter(m => m.type === 'outgoing')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  return (incoming - outgoing).toFixed(2);
});

definePageMeta({
  layout: 'cabinet',
});

// Загрузка данных
onMounted(async () => {
  await fetchObject();
  await fetchMaterials();
  await fetchOperations();
});

async function fetchObject() {
  try {
    const response = await useNuxtApp().$axios.get(`/objects/${objectId}`);
    object.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении объекта:', error);
    router.push('/cabinet/objects');
  }
}

async function fetchMaterials() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/materials/${objectId}`
    );
    materials.value = response.data.map(m => ({
      ...m,
      amount: Number(m.amount) || 0 // Убедитесь, что amount преобразован в число
    }));
    console.log('Преобразованные материалы:', materials.value); // Проверьте, что amount — число
  } catch (error) {
    console.error('Ошибка при получении материалов:', error);
  }
}

// В файле pages/cabinet/objects/[id].vue
async function fetchOperations() {
  try {
    const response = await useNuxtApp().$axios.get(`/objects/${objectId}/operations`);
    // Преобразование amount в число при маппинге
    operations.value = [
      ...response.data.comings.map(op => ({
        ...op,
        type: 'coming',
        amount: Number(op.amount) || 0 // !Важно!
      })),
      ...response.data.expenses.map(op => ({
        ...op,
        type: 'expense',
        amount: Number(op.amount) || 0 // !Важно!
      })),
    ];
  } catch (error) {
    console.error('Ошибка при получении операций:', error);
  }
}

// Обработчики событий из компонентов
function handleMaterialAdded(material) {
  materials.value.push(material);
}

function handleMaterialUpdated(updatedMaterial) {
  const index = materials.value.findIndex(m => m.id === updatedMaterial.id);
  if (index !== -1) {
    materials.value.splice(index, 1, updatedMaterial);
  }
}

function handleMaterialDeleted(id) {
  materials.value = materials.value.filter(m => m.id !== id);
}

function handleComingAdded(coming) {
  operations.value.push({ ...coming, type: 'coming' });
}

function handleExpenseAdded(expense) {
  operations.value.push({ ...expense, type: 'expense' });
}
</script>

<style scoped>
.object-detail {
  padding: 1rem;
}

.object-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.balance-section {
  margin-bottom: 1.5rem;
}

.tabs button {
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

.content {
  margin-top: 1rem;
}

.balance-item strong {
  font-weight: bold;
  color: #28a745;
}
</style>