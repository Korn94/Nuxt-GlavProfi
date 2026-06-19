<!-- app/components/pages/cabinet/settings/permissions/Users/UserOverridesList.vue -->
 <template>
  <div class="user-overrides">
    <div class="overrides-title">
      <Icon name="mdi:pencil-box-multiple" size="16" />
      Активные переопределения
    </div>
    <div class="overrides-list">
      <div
        v-for="override in overrides"
        :key="override.id"
        class="override-item"
      >
        <div class="override-info">
          <!-- Название страницы -->
          <div class="override-page">
            <Icon :name="getPageIcon(override.pageSlug)" size="16" />
            <span class="override-page-name">{{ getPageName(override.pageSlug) }}</span>
          </div>

          <!-- Теги прав (включено/выключено) -->
          <div class="override-permissions">
            <span
              v-for="perm in getPermissionsList(override)"
              :key="perm.key"
              :class="['perm-tag', `perm-${perm.value ? 'on' : 'off'}`]"
            >
              {{ perm.label }}
            </span>
          </div>

          <!-- Причина (если есть) -->
          <div v-if="override.reason" class="override-reason">
            <Icon name="mdi:comment-text-outline" size="12" />
            {{ override.reason }}
          </div>

          <!-- Срок действия (если есть) -->
          <div v-if="override.expiresAt" class="override-expires">
            <Icon name="mdi:clock-outline" size="12" />
            До {{ formatDate(override.expiresAt) }}
          </div>
        </div>

        <!-- Кнопка удаления -->
        <button
          class="btn-icon btn-icon-danger"
          @click="$emit('remove', override.pageSlug)"
          title="Удалить переопределение"
          :disabled="removing"
        >
          <Icon name="mdi:close" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================
// ТИПЫ
// ============================================
interface UserOverride {
  id: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
}

interface SystemPage {
  slug: string
  name: string
  icon: string | null
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

// ============================================
// ПРОПСЫ
// ============================================
defineProps<{
  /** Массив переопределений пользователя */
  overrides: UserOverride[]
  /** Список всех страниц (для получения названий и иконок) */
  pages: SystemPage[]
  /** Флаг процесса удаления (блокирует кнопки) */
  removing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  /** Удалить переопределение для конкретной страницы */
  (e: 'remove', pageSlug: string): void
}>()

// ============================================
// МЕТОДЫ
// ============================================

/**
 * Получить название страницы по slug
 */
function getPageName(slug: string): string {
  // @ts-ignore - pages приходят через props
  const page = (window as any).__pages_cache?.find((p: SystemPage) => p.slug === slug)
  if (page) return page.name

  // Fallback: ищем через props (если кэш не работает)
  return slug
}

/**
 * Получить иконку страницы по slug
 */
function getPageIcon(slug: string): string {
  // @ts-ignore
  const page = (window as any).__pages_cache?.find((p: SystemPage) => p.slug === slug)
  return page?.icon || 'mdi:file-outline'
}

/**
 * Сформировать список тегов прав для отображения
 * Показываем только те права, которые были переопределены (не null)
 */
function getPermissionsList(override: UserOverride): Array<{
  key: string
  label: string
  value: boolean | null
}> {
  const result: Array<{ key: string; label: string; value: boolean | null }> = []

  // Просмотр (всегда показываем если переопределён)
  if (override.canView !== null) {
    result.push({ key: 'canView', label: 'Просмотр', value: override.canView })
  }

  // Создание
  if (override.canCreate !== null) {
    result.push({ key: 'canCreate', label: 'Создание', value: override.canCreate })
  }

  // Редактирование
  if (override.canEdit !== null) {
    result.push({ key: 'canEdit', label: 'Ред.', value: override.canEdit })
  }

  // Удаление
  if (override.canDelete !== null) {
    result.push({ key: 'canDelete', label: 'Удал.', value: override.canDelete })
  }

  // 🆕 Спец. операции (новая система)
  if (override.canSpecial !== null) {
    result.push({ key: 'canSpecial', label: 'Спец.', value: override.canSpecial })
  }

  return result
}

/**
 * Форматирование даты для отображения
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style lang="scss" scoped>
.user-overrides {
  padding: 0 1.25rem 1.25rem;
}

.overrides-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-secondary);

  svg {
    color: var(--crm-accent);
  }
}

.overrides-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.override-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
  }
}

.override-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.override-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--crm-text-primary);

  svg {
    color: var(--crm-accent);
    flex-shrink: 0;
  }
}

.override-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.perm-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;

  &.perm-on {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &.perm-off {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    text-decoration: line-through;
  }
}

.override-reason,
.override-expires {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// ── КНОПКА УДАЛЕНИЯ ─────────────────────────────────────
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  color: var(--crm-text-secondary);
  border: 1px solid transparent;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &.btn-icon-danger:hover:not(:disabled) {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 480px) {
  .override-item {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-icon {
    align-self: flex-end;
  }
}
</style>