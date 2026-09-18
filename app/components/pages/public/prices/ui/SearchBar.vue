<template>
  <div class="search-bar">
    <div class="search-bar__wrapper">
      <Icon name="mdi:magnify" class="search-bar__icon" size="20" />
      <input
        type="text"
        :value="modelValue"
        placeholder="Поиск по работам..."
        class="search-bar__input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <Transition name="fade">
        <button
          v-if="modelValue"
          class="search-bar__clear"
          type="button"
          @click="$emit('clear')"
        >
          <Icon name="mdi:close" size="18" />
        </button>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.search-bar {
  margin-bottom: 20px;

  &__wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    padding: 14px 46px 14px 46px;
    color: $text-dark;
    background: #f7f8fa;
    border: 1.5px solid transparent;
    border-radius: 12px;
    outline: none;
    font-size: 0.95rem;
    transition: all 0.25s ease;

    &::placeholder {
      color: #9aa3ae;
    }

    &:hover {
      background: #f2f4f7;
    }

    &:focus {
      background: #fff;
      border-color: $blue;
      box-shadow: 0 0 0 4px rgba(0, 195, 245, 0.12);
    }

    @media (max-width: 600px) {
      padding: 12px 42px 12px 42px;
      font-size: 0.9rem;
    }
  }

  &__icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #9aa3ae;
    transition: color 0.25s ease;
  }

  &__wrapper:focus-within &__icon {
    color: $blue;
  }

  &__clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(0, 0, 0, 0.06);
    color: $red;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(245, 0, 0, 0.15);
      color: red;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.8);
}
</style>