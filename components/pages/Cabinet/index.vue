<template>
  <div class="profile-page">
    <h1 class="page-title">Главная страница</h1>

    <div v-if="isLoading" class="loading-text"><Icon name="eos-icons:bubble-loading" size="34px" /></div>

    <div v-else-if="data" class="profile-card">
      <div class="user-info">
        <h2>Добро пожаловать, {{ data.user.name }}!</h2>
        <p class="role"><strong>Роль:</strong> {{ data.user.role }}</p>
      </div>

      <!-- Информация о контрагенте -->
      <div v-if="contractorData" class="contractor-info">
        <h3>Информация о контрагенте</h3>
        <ul>
          <li><strong>Тип:</strong> {{ contractorData.type }}</li>
          <li><strong>Имя:</strong> {{ contractorData.name }}</li>
          <li><strong>Телефон:</strong> {{ contractorData.phone }}</li>
          <li><strong>Баланс:</strong> <span class="balance">{{ contractorData.balance }} ₽</span></li>
        </ul>
      </div>
    </div>

    <p v-else class="error-text">Не удалось загрузить данные.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { navigateTo } from '#app'

const data = ref(null)
const contractorData = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      navigateTo('/login')
      return
    }

    data.value = response

    const userData = data.value.user

    if (userData.contractorId && userData.contractorType) {
      const contractorTypeMap = {
        office: 'offices',
        foreman: 'foremans',
        worker: 'workers',
        master: 'masters'
      }

      const type = contractorTypeMap[userData.contractorType] || 'default'
      const res = await $fetch(`/api/contractors/${type}/${userData.contractorId}`, {
        method: 'GET',
        credentials: 'include'
      })
      contractorData.value = res
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
    const { logout } = useAuth()
    logout()
    navigateTo('/login')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  
  .page-title {
    font-size: 2.5rem;
    color: #3182ce;
    margin-bottom: 2rem;
    text-align: center;
  }

  .loading-text {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 20vh;
    svg {
      animation: spin infinite 2s linear;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  }

  .profile-card {
    width: 100%;
    max-width: 600px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-top: 2rem;

    h2 {
      font-size: 1.8rem;
      color: #4a5568;
      margin-bottom: 1rem;
    }

    p.role {
      font-size: 1.2rem;
      color: #718096;
      margin-bottom: 2rem;
    }

    .contractor-info {
      margin-top: 2rem;
      
      ul {
        list-style-type: none;
        padding-left: 0;
        
        li {
          margin-bottom: 0.5rem;
          
          strong {
            font-weight: bold;
            color: #4a5568;
          }
          
          span.balance {
            color: #38b2ac;
            font-weight: bold;
          }
        }
      }
    }
  }

  .error-text {
    font-size: 1.5rem;
    color: red;
    text-align: center;
    margin-top: 2rem;
  }
}
</style>