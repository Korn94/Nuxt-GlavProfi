<template>
  <div class="repair-calculator">
    <!-- <div class="toggle-buttons">
      <button
        :class="{ active: currentView === 'detailed' }"
        @click="currentView = 'detailed'"
      >
        Подробная
      </button>
      <button
        :class="{ active: currentView === 'approximate' }"
        @click="currentView = 'approximate'"
      >
        Примерная
      </button>
    </div> -->

    <div class="calculator-view">
      <DetailedCalculator v-if="currentView === 'detailed'" />
      <ApproximateCalculator v-else />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DetailedCalculator from './DetailedCalculator.vue';
import ApproximateCalculator from './ApproximateCalculator.vue';

const currentView = ref('detailed');
</script>

<style scoped lang="scss">
.repair-calculator {
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  
  .toggle-buttons {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    
    button {
      width: 100%;
      padding: 0.8em;
      background: #f0f0f0;
      color: #111;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: 0.3s;

      &.active {
        background-color: #00c3f5;
        color: #111;
      }
      
      &:hover {
        background: #00c3f5;
      }

      &:not(:last-child) {
        margin-right: 10px;
      }
    }
  }

  .calculator-view {
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
