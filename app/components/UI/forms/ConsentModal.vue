<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal-content">
      <h3>Обратный звонок</h3>
      <p class="main-text">
        Нажимая «Принять», вы соглашаетесь с <NuxtLink to="/privacy-policy">политикой конфиденциальности</NuxtLink>.
      </p>
      <p class="note">
        *Мы используем Ваши данные только для обратной связи
      </p>
      <div class="buttons">
        <button @click="accept">Принять</button>
        <button class="secondary" @click="reject">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue', 'accept'],
  methods: {
    accept() {
      this.$emit('accept');
      this.$emit('update:modelValue', false);
    },
    reject() {
      this.$emit('update:modelValue', false);
    }
  }
};
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$text-color: #333;
$bg-color: #fff;
$border-radius: 8px;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: $bg-color;
  padding: 16px 20px;
  border-radius: $border-radius;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    font-size: 1rem;
    font-weight: 600;
    color: $text-color;
  }

  .main-text {
    font-size: 0.85rem;
    color: #555;
    margin: 10px 0 5px;
    line-height: 1.4;

    a {
      color: #00c3f5;
      text-decoration: underline;
    }
  }

  .note {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 16px;
    line-height: 1.3;
  }
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 10px;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
    }

    &.secondary {
      background-color: #eee;
      color: #333;
    }
  }

  button:first-child {
    background-color: $primary-color;
    color: white;
  }
}
</style>