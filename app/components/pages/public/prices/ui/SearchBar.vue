<!-- app/components/pages/public/prices/ui/SearchBar.vue -->
 <template>
  <div class="search-bar">
    <div class="search-bar__wrapper">
      <Icon name="mdi:search" class="search-bar__icon" width="24" height="24" />
      <input
        type="text"
        :value="modelValue"
        placeholder="Поиск по работам..."
        class="search-bar__input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <Icon
        v-if="modelValue"
        name="mdi:close"
        class="search-bar__clear"
        width="24"
        height="24"
        @click="$emit('clear')"
      />
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
.search-bar {
  margin-bottom: 15px;

  &__wrapper {
    position: relative;
    width: 100%;
  }

  &__input {
    width: 100%;
    padding: 10px 15px;
    padding-left: 36px;
    padding-right: 30px;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 5px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);

    &:focus {
      border-color: $blue;
      box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    }
  }

  &__icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  &__clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }
}
</style>