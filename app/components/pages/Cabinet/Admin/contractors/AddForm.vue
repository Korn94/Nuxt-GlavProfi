<!-- app/components/pages/cabinet/Contractor/AddForm.vue -->
<template>
  <div class="add-contractor-form">
    <!-- Имя -->
    <div class="form-group">
      <label>Имя <span class="required">*</span></label>
      <input v-model="formData.name" placeholder="Введите имя" required />
      <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
    </div>

    <!-- Телефон -->
    <div class="form-group">
      <label>Телефон</label>
      <input v-model="formData.phone" placeholder="Введите телефон" />
    </div>

    <!-- Роль (тип контрагента) -->
    <div class="form-group">
      <label>Тип контрагента <span class="required">*</span></label>
      <select v-model="formData.role" required>
        <option value="master">Мастер</option>
        <option value="foreman">Прораб</option>
        <option value="worker">Рабочий</option>
        <option value="office">Офис</option>
      </select>
    </div>

    <!-- Привязка к пользователю -->
    <div v-if="showUserSelect" class="form-group">
      <label>Привязать к пользователю</label>
      <select v-model="formData.userId">
        <option value="">Без привязки</option>
        <option v-for="user in availableUsers" :key="user.id" :value="user.id">
          {{ user.name }} ({{ user.role }})
        </option>
      </select>
    </div>

    <!-- Выполняемые работы (только для мастеров) -->
    <div v-if="formData.role === 'master'" class="form-group works-section">
      <label>Выполняемые работы</label>
      <div class="checkbox-group">
        <label v-for="work in works" :key="work" class="checkbox-label">
          <input type="checkbox" :value="work" v-model="formData.works" />
          {{ work }}
        </label>
      </div>
    </div>

    <!-- Комментарий -->
    <div class="form-group">
      <label>Комментарий</label>
      <textarea v-model="formData.comment" placeholder="Дополнительная информация"></textarea>
    </div>

    <!-- Ошибки формы -->
    <div v-if="errors.form" class="error-message form-error">
      {{ errors.form }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Список работ для мастеров
const works = ['Малярка', 'Сантехника', 'Электрика', 'Другое']

// Пользователи
const users = defineModel('users', { default: () => [] })

// Форма
const formData = defineModel('formData', {
  default: () => ({
    name: '',
    phone: '',
    role: 'master',
    userId: '',
    works: [],
    comment: ''
  })
})

// Ошибки
const errors = defineModel('errors', { default: () => ({}) })

// Доступные пользователи (фильтруем по типу)
const availableUsers = computed(() => {
  return users.value.filter(user => {
    // Можно привязать только если нет привязки или та же роль
    return !user.contractorId || user.contractorType === formData.value.role
  })
})

// Показывать выбор пользователя?
const showUserSelect = computed(() => !!formData.value.role)
</script>

<style lang="scss" scoped>
.add-contractor-form {
  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: $text-dark;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    transition: $transition;

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 2px $blue20;
    }
  }

  .required {
    color: $red;
  }

  .error-message {
    color: $color-danger;
    font-size: 0.875rem;
    margin-top: 0.25rem;

    &.form-error {
      padding: 0.75rem;
      background: rgba($color-danger, 0.1);
      border: 1px solid rgba($color-danger, 0.2);
      border-radius: $border-radius;
      margin-top: 1rem;
    }
  }

  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;

    input[type="checkbox"] {
      margin: 0;
    }
  }
}
</style>