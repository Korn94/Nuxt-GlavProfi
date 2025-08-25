<template>
  <div class="select-or-input">
    <select v-model="selectedValue" @change="handleChange">
      <option v-for="option in predefinedOptions" :key="option" :value="option">
        {{ option }}
      </option>
      <option value="custom">Другое</option>
    </select>
    <input
      v-if="isCustom"
      v-model="customValue"
      placeholder="Введите значение"
      @input="handleCustomInput"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'м²'
  }
})

const emit = defineEmits(['update:modelValue'])

// Предустановленные варианты
const predefinedOptions = ['м²', 'м³', 'м.п.', 'шт', 'от']

const selectedValue = ref(props.modelValue)
const customValue = ref('')
const isCustom = computed(() => !predefinedOptions.includes(selectedValue.value))

function handleChange() {
  if (selectedValue.value === 'custom') return
  emit('update:modelValue', selectedValue.value)
}

function handleCustomInput() {
  emit('update:modelValue', customValue.value)
}
</script>

<style lang="scss" scoped>
.select-or-input {
  display: flex;
  gap: 10px;
  select,
  input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
  input {
    flex: 1;
  }
}
</style>