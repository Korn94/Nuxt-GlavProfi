<!-- app/components/pages/Cabinet/Diagnostics/OnlineCard.vue -->
<!-- Блок «Онлайн»: список пользователей из onlineStore (статусы, путь, устройство). -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Онлайн" :badge="onlineCount" tall>
    <template #actions>
      <button class="btn btn--sm" @click="emit('refresh')">↺</button>
    </template>

    <div class="online-list">
      <div v-for="u in users" :key="u.userId" class="online-user">
        <div :class="['online-user__dot', `online-user__dot--${u.status}`]" />
        <div class="online-user__info">
          <span class="online-user__name">{{ u.user?.name || u.user?.login || '—' }}</span>
          <span class="online-user__meta">{{ u.user?.role }} · {{ u.activePath || '/' }} · {{ u.deviceType }}</span>
        </div>
        <span :class="['online-user__status', `online-user__status--${u.status}`]">{{ u.status }}</span>
      </div>
      <div v-if="!users.length" class="empty">Нет онлайн-пользователей</div>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import type { OnlineUser } from '~/types'

defineProps<{
  /** Пользователи из onlineStore (на сервере — пустой массив) */
  users: OnlineUser[]
  /** Количество со статусом online (для бейджа) */
  onlineCount: number
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Online list ─────────────────────────────────────────────────────
.online-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: $bg3 transparent;
}

.online-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  background: $bg2;
  border: 1px solid $border;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--online {
      background: $ok;
      box-shadow: 0 0 5px $ok;
    }

    &--afk {
      background: $warn;
    }

    &--offline {
      background: $muted;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 11px;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    padding: 2px 6px;
    border-radius: 3px;

    &--online {
      background: rgba($ok, .15);
      color: $ok;
    }

    &--afk {
      background: rgba($warn, .15);
      color: $warn;
    }

    &--offline {
      background: $bg3;
      color: $muted;
    }
  }
}
</style>
