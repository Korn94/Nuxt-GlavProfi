<!-- app/components/pages/cabinet/ui/cards/index.vue -->
<template>
  <div class="card" :class="[`card--${variant}`, { 'card--loading': loading }]">

    <!-- Заголовок -->
    <header v-if="!loading && (title || $slots.header || $slots.actions)" class="card__header">
      <div class="card__header-left">
        <!-- Иконка -->
        <div v-if="$slots.icon" class="card__icon">
          <slot name="icon" />
        </div>

        <!-- Заголовок -->
        <h3 v-if="title" class="card__title">{{ title }}</h3>
        <slot v-else name="header" />
      </div>

      <!-- Действия -->
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- Скелетон при загрузке -->
    <div v-if="loading" class="card__skeleton">
      <div class="skeleton skeleton--title" />
      <div class="skeleton skeleton--line" />
      <div class="skeleton skeleton--line skeleton--short" />
    </div>

    <!-- Контент -->
    <main v-else class="card__body" :class="{ 'card__body--flush': flush }">
      <slot />
    </main>

    <!-- Футер -->
    <footer v-if="!loading && $slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>

  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps < {
  title?: string
  // default  — стандартная карточка
  // flat     — без рамки, только фон
  // outlined — только рамка, без фона
  variant?: 'default' | 'flat' | 'outlined'
  loading?: boolean
  // flush — убирает padding у body (для таблиц, списков вплотную к краям)
  flush?: boolean
} > (), {
  variant: 'default',
  loading: false,
  flush: false,
})
</script>

<style lang="scss" scoped>
// ── Базовая карточка ────────────────────────────────────────────────
.card {
  display: flex;
  flex-direction: column;
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  transition: var(--crm-transition);

  // Варианты
  &--default {
    background: var(--crm-bg-surface);
    border: 1px solid var(--crm-border);
  }

  &--flat {
    background: var(--crm-bg-elevated);
    border: none;
  }

  &--outlined {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
  }

  &--loading {
    pointer-events: none;
  }
}

// ── Заголовок ───────────────────────────────────────────────────────
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;

  &-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
}

.card__icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-accent-dim);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-accent);
  flex-shrink: 0;
}

.card__title {
  font-size: var(--crm-text-md);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

// ── Контент ─────────────────────────────────────────────────────────
.card__body {
  flex: 1;
  padding: 16px;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-base);
  line-height: 1.6;

  &--flush {
    padding: 0;
  }
}

// ── Футер ───────────────────────────────────────────────────────────
.card__footer {
  padding: 10px 16px;
  border-top: 1px solid var(--crm-border);
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

// ── Скелетон ────────────────────────────────────────────────────────
.card__skeleton {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton {
  border-radius: var(--crm-radius-sm);
  background: linear-gradient(90deg,
      var(--crm-bg-elevated) 25%,
      var(--crm-bg-overlay) 50%,
      var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.6s infinite;

  &--title {
    height: 20px;
    width: 45%;
  }

  &--line {
    height: 14px;
    width: 100%;
  }

  &--short {
    width: 65%;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>