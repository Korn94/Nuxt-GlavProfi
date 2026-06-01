<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/NavBreadcrumbsRow.vue -->
<template>
  <div class="nav-breadcrumbs-row">
    <slot name="breadcrumbs" />
    <slot name="nav" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

// === Основной контейнер ===
.nav-breadcrumbs-row {
  max-width: 1200px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  background: $background-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 2rem;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0 1em;
  }
}

// === Breadcrumbs слева — не сжимаются ===
.nav-breadcrumbs-row :deep(.breadcrumbs) {
  flex-shrink: 0;
  background: transparent;
  border-bottom: none;
  padding: 1rem 0;
}

.nav-breadcrumbs-row :deep(.breadcrumbs__container) {
  max-width: none;
  padding: 0;
  margin: 0;
}

// === StickyNav справа ===
.nav-breadcrumbs-row :deep(.sticky-nav-wrapper) {
  flex: none;
  margin-left: auto;
  min-width: 0;
  max-width: 60%;
  position: relative;

  @media (max-width: 1024px) {
    max-width: 55%;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    margin-left: 0;
  }
}

.nav-breadcrumbs-row :deep(.sticky-nav) {
  width: 100%;
}

// Контейнер навигации
.nav-breadcrumbs-row :deep(.sticky-nav__container) {
  max-width: none;
  padding: 0;
  margin: 0;
}

// Список
.nav-breadcrumbs-row :deep(.sticky-nav__list) {
  justify-content: flex-start;
  overflow-x: auto;
  mask-image: none;
}

// === При прилипании ===
.nav-breadcrumbs-row :deep(.sticky-nav--stuck .sticky-nav__list) {
  padding: 0 1em;
  overflow-x: auto;
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black 12px,
    black calc(100% - 12px),
    transparent 100%
  );

  @media (min-width: 768px) {
    justify-content: center;
  }
}

// === Мобильная версия ===
@media (max-width: 768px) {
  .nav-breadcrumbs-row :deep(.sticky-nav__list) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .nav-breadcrumbs-row :deep(.sticky-nav__list)::-webkit-scrollbar {
    display: none;
  }
}
</style>