<!-- app/components/pages/cabinet/Admin/Users/UserItem.vue -->
<template>
  <div class="user-item" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    <!-- Левая часть: Аватар + Имя/Логин -->
    <div class="user-item__info">
      <div class="user-avatar" :style="{ backgroundColor: avatarColor }">
        {{ initials }}
      </div>
      <div class="user-details">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-login">@{{ user.login }}</span>
      </div>
    </div>

    <!-- Центр: Роль + Дата создания -->
    <div class="user-item__meta">
      <span :class="['role-badge', `role-badge--${user.role}`]">{{ roleLabel }}</span>
      <span v-if="user.createdAt" class="user-created" :title="fullDate">
        <Icon name="mdi:calendar" size="12" />
        {{ shortDate }}
      </span>
    </div>

    <!-- Действия (появляются при ховере на десктопе, всегда видны на мобильных) -->
    <div class="user-item__actions" :class="{ 'actions--hover': isHovered }">
      <button class="action-btn" title="Редактировать" @click="$emit('edit', user)">
        <Icon name="mdi:pencil" size="15" />
      </button>
      <button class="action-btn" title="Сменить пароль" @click="$emit('change-password', user)">
        <Icon name="mdi:key" size="15" />
      </button>
      <button class="action-btn action-btn--danger" title="Удалить" @click="$emit('delete', user)">
        <Icon name="mdi:delete" size="15" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { User } from 'stores/users'

const props = defineProps<{
  user: User
}>()

defineEmits<{
  edit: [user: User]
  'change-password': [user: User]
  delete: [user: User]
}>()

// ── Вычисляемые данные ──────────────────────────────────────────────
const initials = computed(() => {
  const name = props.user.name?.trim() || ''
  if (!name) return '?'
  
  const parts = name.split(' ').filter(p => p.length > 0)
  if (parts.length === 0) return '?'
  
  // Безопасный доступ к первой букве
  const first = parts[0]?.charAt(0)?.toUpperCase() || '?'
  
  if (parts.length === 1) return first
  
  // Безопасный доступ к первой букве последнего слова
  const last = parts[parts.length - 1]?.charAt(0)?.toUpperCase() || '?'
  
  return `${first}${last}`
})

// Цвет аватара на основе ID (стабильный хэш)
const avatarColor = computed(() => {
  const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c', '#9aa0b8']
  return colors[props.user.id % colors.length]
})

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}
const roleLabel = computed(() => roleLabels[props.user.role] || props.user.role)

// Даты
const shortDate = computed(() => {
  if (!props.user.createdAt) return ''
  return new Date(props.user.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
})
const fullDate = computed(() => {
  if (!props.user.createdAt) return ''
  return new Date(props.user.createdAt).toLocaleString('ru-RU')
})

// Ховер-состояние для десктопа
const isHovered = ref(false)
</script>

<style lang="scss" scoped>
.user-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: var(--crm-transition);
  cursor: default;

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }

  // ── Info ────────────────────────────────────────────────────────
  &__info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transform: translateX(8px);
    transition: var(--crm-transition);
    
    &.actions--hover {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

// Аватар
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: var(--crm-text-sm);
  flex-shrink: 0;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: var(--crm-text-md);
  color: var(--crm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-login {
  font-family: var(--crm-font-mono);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// Роль
.role-badge {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;

  &--admin {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    border: 1px solid rgba(242, 95, 92, 0.3);
  }
  &--manager {
    background: var(--crm-info-dim);
    color: var(--crm-info);
    border: 1px solid rgba(91, 141, 239, 0.3);
  }
  &--foreman {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
    border: 1px solid rgba(245, 166, 35, 0.3);
  }
  &--master {
    background: var(--crm-success-dim);
    color: var(--crm-success);
    border: 1px solid rgba(61, 214, 140, 0.3);
  }
  &--worker {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
    border: 1px solid rgba(0, 195, 245, 0.3);
  }
}

.user-created {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// Статус
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--online {
    background: var(--crm-success);
    box-shadow: 0 0 4px var(--crm-success);
  }
  &--afk {
    background: var(--crm-warning);
  }
  &--offline {
    background: var(--crm-text-disabled);
  }
}

.status-text {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// Кнопки действий
.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
}

// Адаптив: на мобильных кнопки всегда видны
@media (max-width: 767.98px) {
  .user-item {
    flex-wrap: wrap;
    gap: 10px;
  }
  .user-item__actions {
    order: 3;
    width: 100%;
    justify-content: flex-end;
    opacity: 1;
    transform: none;
    padding-top: 6px;
    border-top: 1px solid var(--crm-border);
    margin-top: 2px;
  }
}
</style>