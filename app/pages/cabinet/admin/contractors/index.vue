<template>
  <div class="container">
    <!-- Контейнер для вывода меню -->
    <LayoutCabinetHeaderWorkersMenu />
    
    <!-- Блок категорий контрагентов -->
    <section class="contractor-categories">
      <ul class="categories-list">
        <li v-for="category in categories" :key="category.type" class="category-item">
          <strong>{{ category.label }}:</strong> {{ category.count }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Массив для хранения всех контрагентов
const contractors = ref([])

// Подсчет числа контрагентов по каждой категории
const categories = computed(() => [
  { type: 'master', label: 'Мастера', count: contractors.value.filter(c => c.type === 'master').length },
  { type: 'worker', label: 'Рабочие', count: contractors.value.filter(c => c.type === 'worker').length },
  { type: 'foreman', label: 'Прорабы', count: contractors.value.filter(c => c.type === 'foreman').length },
  { type: 'office', label: 'Офисные сотрудники', count: contractors.value.filter(c => c.type === 'office').length },
])

// Загрузка данных с сервера
async function fetchContractors() {
  try {
    const res = await fetch('/api/contractors')
    if (!res.ok) throw new Error('Ошибка при получении данных.')
    const data = await res.json()
    contractors.value = data
  } catch (err) {
    console.error(err)
  }
}

// Запуск загрузки данных при монтировании компонента
onMounted(fetchContractors)

definePageMeta({ 
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})
</script>

<style lang="scss" scoped>
/* Стили для раздела категорий */
.contractor-categories {
  display: flex;
  // justify-content: center;
  align-items: center;
  background-color: #fafafa;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .1);
  margin-top: 20px;
  padding: 20px;

  ul.categories-list {
    list-style-type: none;
    padding-left: 0;
    text-align: left;

    li.category-item {
      font-size: 16px;
      line-height: 1.5;
      color: #333;
      margin-bottom: 10px;
      
      strong {
        font-weight: bold;
      }
    }
  }
}
</style>