<!-- app/components/pages/public/remontPomescheniy/index/blocks/PageIntro.vue -->
<template>
  <section class="page-intro">
    <div class="container">
      <!-- Главный заголовок -->
      <h1 class="page-intro__title">
        Ремонт и отделка <span class="accent">коммерческих помещений</span> под ключ
      </h1>

      <!-- Краткий подзаголовок -->
      <p class="page-intro__subtitle">
        Собственные бригады. Работа по ТЗ и проектной документации.
        Фиксируем смету и сроки в договоре.
      </p>

      <!-- Trust-строка -->
      <ul class="page-intro__trust">
        <li class="trust-item trust-item--guarantee">
          <Icon name="mdi:shield-check-outline" size="18" mode="svg" />
          <span>Договор и гарантия 3 года</span>
        </li>
        <li class="trust-item trust-item--fast">
          <Icon name="mdi:clock-fast" size="18" mode="svg" />
          <span>Подробная смета за 24 часа</span>
        </li>
        <li class="trust-item trust-item--brigades">
          <Icon name="mdi:account-hard-hat-outline" size="18" mode="svg" />
          <span>Свои бригады мастеров</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
// Логика навигации удалена — блок упрощён
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.page-intro {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;

  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

  .container {
    @include section-container;
  }

  // === Заголовок (как в HeaderType) ===
  &__title {
    @include page-title;
    color: $text-dark;
    margin-bottom: 1rem;

    .accent {
      color: $blue;
    }
  }

  // === Подзаголовок (как в HeaderType) ===
  &__subtitle {
    font-size: 1.15rem;
    line-height: 1.6;
    color: $text-gray;
    max-width: 700px;
    margin: 0 0 2.25rem;

    @media (max-width: 768px) {
      font-size: 1rem;
      margin-bottom: 1.75rem;
    }
  }

  // === Trust-строка ===
  &__trust {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;

    .trust-item {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 1.1rem 0.55rem 0.6rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: $text-dark;
      line-height: 1.3;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 999px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: transform 0.25s ease, box-shadow 0.25s ease,
                  border-color 0.25s ease;

      // Общий «бейдж» под иконку
      // :deep(svg) {
      //   width: 30px;
      //   height: 30px;
      //   padding: 6px;
      //   box-sizing: border-box;
      //   border-radius: 50%;
      //   flex-shrink: 0;
      //   transition: background 0.25s ease, color 0.25s ease;
      // }

      &:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 0, 0, 0.12);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
      }
    }

    // === Цвета иконок ===
    .trust-item--guarantee :deep(svg) {
      color: $green !important;
      // background: rgba(0, 161, 42, 0.12);
    }

    .trust-item--fast :deep(svg) {
      color: $blue !important;
      // background: rgba(0, 195, 245, 0.14);
    }

    .trust-item--brigades :deep(svg) {
      color: $yellow !important;
      // background: rgba(250, 183, 2, 0.15);
    }

    // На мобильных — вертикальный стек
    @media (max-width: 640px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.6rem;

      .trust-item {
        font-size: 0.9rem;
        padding: 0.5rem 0.95rem 0.5rem 0.5rem;

        :deep(svg) {
          width: 28px;
          height: 28px;
          padding: 5px;
        }
      }
    }
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .page-intro {
    padding-top: 3rem;
    padding-bottom: 2.5rem;
  }
}
</style>