<template>
  <div>
    <LayoutCabinetHeaderWorkersMenu />
    <div class="list">
      <h2>{{ title }}</h2>

      <!-- Сообщение об ошибке -->
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Баланс</th>
            <th>Комментарий</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contractor in contractors" :key="contractor.id">
            <td>{{ contractor.id }}</td>
            <td>{{ contractor.name }}</td>
            <td>{{ contractor.balance }}</td>
            <td>{{ contractor.comment }}</td>
            <td>
              <router-link 
                :to="`/cabinet/admin/contractors/${route.params.role}/${contractor.id}`"
                class="button"
              >
                Просмотреть
              </router-link>
              <button 
                @click="deleteContractor(contractor.id)" 
                class="button delete"
              >
                Удалить
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

const route = useRoute()
const router = useRouter()

// Заголовок страницы
const title = computed(() => {
  switch (route.params.role) {
    case 'master': return 'Мастера'
    case 'foreman': return 'Прорабы'
    case 'worker': return 'Рабочие'
    case 'office': return 'Офис'
    default: return 'Рабочие'
  }
})

// Вычисляемый заголовок для мета-тега
const pageTitle = computed(() => {
  const roleTitle = title.value
  return `CRM — ${roleTitle}`
})

const contractors = ref([])
const errorMessage = ref(null)

onMounted(async () => {
  try {
    const data = await $fetch('/api/contractors', {
      method: 'GET',
      params: { type: route.params.role },
      credentials: 'include'
    })

    // Убедитесь, что данные — массив
    if (Array.isArray(data)) {
      contractors.value = data
    } else {
      console.warn('Неожиданный формат данных:', data)
      contractors.value = []
      errorMessage.value = 'Получены некорректные данные'
    }

  } catch (err) {
    console.error('Ошибка при загрузке контрагентов:', err)
    errorMessage.value = 'Не удалось загрузить список контрагентов.'
  }
})

async function deleteContractor(id) {
  if (!confirm('Вы уверены, что хотите удалить этого контрагента?')) return

  try {
    const res = await $fetch(`/api/contractors/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    contractors.value = contractors.value.filter(c => c.id !== id)
    alert(res.message || 'Успешно удалено')
  } catch (err) {
    console.error('Ошибка удаления:', err)
    alert('Ошибка при удалении контрагента')
  }
}

useHead(() => ({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: pageTitle.value
}))
</script>

<style lang="scss" scoped>
.list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
}

button {
  margin: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: #fff;
}

button:hover {
  background-color: #0056b3;
}

.error {
  border-color: red;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.form {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 4px;
}

textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
}

.block {
  margin-bottom: 30px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  border: 1px solid #e0e0e0;
  margin: 10px 0;
  padding: 15px;
  border-radius: 4px;
}
</style>