<template>
    <div class="modal" @click="closeModal">
      <div class="content">
        <div class="block_form">
          <span class="close" @click.stop="closeModal">&times;</span>
          <h2>Отправить сообщение</h2>
          <UiForms @formSubmitted="handleFormSubmitted" />
        </div>
        <div class="block">
          <div>
            <p class="text">Отправь фото — получи быстрый расчет</p>
            <UiAnimationsArrow />
          </div>
          <NuxtLink href="https://api.whatsapp.com/send?phone=79109096947" target="_blank"><Icon name="bxl:whatsapp" size="28px" class="whatsapp" /></NuxtLink>
          <NuxtLink href="tg://resolve?domain=glavprofii" target="_blank"><Icon name="bxl:telegram" size="28px" class="tg" /></NuxtLink>
        </div>
      </div>
    </div>
</template>

<script>
export default {
  methods: {
    closeModal(event) {
      // Проверяем, был ли клик на крестике или за пределами контента формы
      if (event.target.classList.contains('modal') || event.target.classList.contains('close')) {
        this.$emit("close");
      }
    },
    handleFormSubmitted(success) {
      this.$emit("formSubmitted", success); // Передаем результат отправки формы на главный компонент
    }
  },
};
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$highlight-color: #ff9800;  // Цвет подсветки
$border-color: #ddd;
$background-light: #f7f7f7;
$sub-item-bg: #f0f0f0; // Цвет фона для расшифровок
$text-color: #18191b;
$shadow-color: rgba(0, 0, 0, 0.05);

.modal {
  position: fixed;
  z-index: 999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;

  .content {
    width: 100%;
    max-width: 500px;
    // box-shadow: 0 4px 10px $shadow-color;
    text-align: center;
    
    .block_form {
      position: relative;
      background: $background-light;
      border-radius: 10px;
      padding: 20px;
      margin: 10px;
    }

    .text {
      color: $sub-item-bg;
      font-weight: 600;
      // text-align: center;
      margin-bottom: 1em;
    }

    .ico {
      width: 25px;
      height: 25px;
      // margin: .5em 0;
      color: #444;
    }

    .whatsapp {
      color: #25d366;
    }

    .tg {
      color: #0088cc;
    }

    .vk {
      color: #4C75A3;
    }

    h2 {
      text-align: center;
      color: $text-color;
      margin-bottom: 20px;
    }

    .close {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 24px;
      color: $text-color;
      cursor: pointer;
      transition: color 0.3s ease;

      &:hover {
        color: $primary-color;
      }
    }

    .block {
      background: $text-color;
      border-radius: 10px;
      padding: 20px;
      margin: 0 10px;
      justify-content: center;
      gap: 15px;
      border: 1px solid #444;

      a {
        margin: 0 5px;
        color: $text-color;
        transition: color 0.3s ease;

        &:hover {
          color: $primary-color;
        }
      }
    }
  }
}
</style>