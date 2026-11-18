<!-- app/components/pages/Cabinet/Diagnostics/UserCard.vue -->
<!-- Блок «Пользователь»: аватар + роль и строки auth-store (кнопка Recheck). -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Пользователь">
    <template #actions>
      <button class="btn btn--sm" @click="emit('recheck')">↺ Recheck</button>
    </template>

    <div v-if="user" class="avatar-block">
      <div class="avatar">{{ initials }}</div>
      <div class="avatar-block__info">
        <div class="avatar-block__name">{{ user.name || '—' }}</div>
        <div class="avatar-block__role">{{ user.role }}</div>
      </div>
    </div>

    <div class="kv-list">
      <div v-for="row in rows" :key="row.k" class="kv">
        <span class="kv__k">{{ row.k }}</span>
        <span :class="['kv__v', row.cls]">{{ row.v }}</span>
      </div>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import type { KvRow } from './shared/types'

defineProps<{
  /** Пользователь из auth-store (до гидратации — null) */
  user: { name?: string | null; role?: string } | null
  /** Инициалы для аватара (2 буквы) */
  initials: string
  /** Строки auth-store (см. index.vue → authRows) */
  rows: KvRow[]
}>()

const emit = defineEmits<{
  recheck: []
}>()
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Avatar ───────────────────────────────────────────────────────────
.avatar-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: $bg2;
  border-radius: 6px;
  border: 1px solid $border;

  &__name {
    font-weight: 600;
    font-size: 14px;
  }

  &__role {
    font-size: 11px;
    color: $muted;
    text-transform: capitalize;
  }
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: $accent;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
