<!-- app\components\pages\public\prices\ui\AdminToggle.vue -->
<template>
  <!-- <Teleport to="body">
    <button
      v-if="dataStore.isAdmin"
      class="admin-toggle"
      :class="{ 'is-active': uiStore.adminMode }"
      :title="uiStore.adminMode ? 'Скрыть кнопки админа' : 'Показать кнопки админа'"
      @click="uiStore.toggleAdminMode"
    >
      <Icon
        :name="uiStore.adminMode ? 'mdi:eye' : 'mdi:eye-off'"
        size="22"
      />
      <span class="admin-toggle__label">
        {{ uiStore.adminMode ? 'Админ' : 'Клиент' }}
      </span>
    </button>
  </Teleport> -->
  <div>s</div>
</template>
<!-- 
<script setup lang="ts">
import { usePriceUIStore, usePriceDataStore } from 'stores/price'

const uiStore = usePriceUIStore()
const dataStore = usePriceDataStore()
</script> -->

<style lang="scss" scoped>
.admin-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid $blue;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.95);
  color: $text-dark;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 195, 245, 0.4);
  }

  &.is-active {
    background: $blue;
    color: $text-light;
  }

  &__label {
    @media (max-width: 450px) {
      display: none;
    }
  }
}

/* На мобилке сдвигаем чуть выше, чтобы не перекрывать нижнюю навигацию */
@media (max-width: 840px) {
  .admin-toggle {
    bottom: 80px;
    right: 15px;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}
</style>