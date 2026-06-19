<!-- app/components/pages/cabinet/settings/permissions/Roles/RoleEditModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`role-edit-title-${role?.role}`"
      >
        <div class="modal-content">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="role-badge" :style="{ background: roleColor }">
                <Icon :name="roleIcon" size="20" />
              </div>
              <div>
                <h2 :id="`role-edit-title-${role?.role}`">
                  Настройка прав: {{ roleName }}
                </h2>
                <p>{{ roleDescription }}</p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="saving"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Информация -->
            <div class="info-block">
              <Icon name="mdi:information-outline" size="18" />
              <span>
                Включите <strong>Просмотр</strong> для раздела, чтобы он появился в меню пользователя.
                Остальные действия активируются только при включённом просмотре.
              </span>
            </div>

            <!-- Сводка -->
            <div class="summary-bar">
              <span class="summary-item">
                <Icon name="mdi:eye" size="16" />
                Доступно разделов: <strong>{{ viewableCount }}</strong> / {{ pages.length }}
              </span>
              <span class="summary-item">
                <Icon name="mdi:plus-circle" size="16" />
                Создание: <strong>{{ createCount }}</strong>
              </span>
              <span class="summary-item">
                <Icon name="mdi:delete" size="16" />
                Удаление: <strong>{{ deleteCount }}</strong>
              </span>
              <span class="summary-item summary-item--special">
                <Icon name="mdi:lightning-bolt" size="16" />
                Спец.: <strong>{{ specialCount }}</strong>
              </span>
            </div>

            <!-- Список страниц -->
            <div class="pages-list">
              <div
                v-for="page in pages"
                :key="page.slug"
                class="page-block"
              >
                <!-- Заголовок страницы: toggle canView + раскрытие -->
                <div
                  class="page-header"
                  @click="togglePageExpanded(page.slug)"
                >
                  <div class="page-main">
                    <!-- Toggle switch для canView -->
                    <div
                      class="page-view-toggle"
                      @click.stop
                    >
                      <label class="toggle-switch">
                        <input
                          type="checkbox"
                          :checked="getPerm(page.slug, 'canView')"
                          :disabled="saving"
                          @change="onToggleView(page.slug)"
                        />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>

                    <!-- Иконка + название -->
                    <div class="page-info">
                      <Icon :name="page.icon || 'mdi:file-outline'" size="18" />
                      <div>
                        <h4>{{ page.name }}</h4>
                        <p v-if="page.description">{{ page.description }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Индикатор раскрытия + тег capabilities -->
                  <div class="page-header-right">
                    <PagesCabinetSettingsPermissionsSharedPermCapabilities
                      v-if="getPerm(page.slug, 'canView')"
                      :page="page"
                      compact
                    />
                    <Icon
                      v-if="getPerm(page.slug, 'canView')"
                      :name="expandedPages.has(page.slug) ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                      size="20"
                      class="expand-icon"
                    />
                  </div>
                </div>

                <!-- Раскрывающиеся действия -->
                <Transition name="expand">
                  <div
                    v-if="getPerm(page.slug, 'canView') && expandedPages.has(page.slug)"
                    class="page-actions"
                  >
                    <PagesCabinetSettingsPermissionsSharedPermCheckboxes
                      :model-value="getPermissionsWithoutView(page.slug)"
                      :page="page"
                      :disabled="saving"
                      @update:model-value="(val: { canCreate: boolean; canEdit: boolean; canDelete: boolean; canSpecial: boolean }) => onActionsUpdate(page.slug, val)"
                    />
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              v-if="isAdmin && role?.role !== 'admin'"
              class="btn btn-ghost"
              @click="$emit('reset')"
              :disabled="saving"
            >
              <Icon name="mdi:restore" size="16" />
              Сбросить к дефолтным
            </button>
            <div class="footer-spacer"></div>
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="saving"
            >
              Отмена
            </button>
            <button
              class="btn btn-primary"
              @click="handleSave"
              :disabled="saving"
            >
              <Icon v-if="saving" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:content-save" size="16" />
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================
// ТИПЫ
// ============================================
interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

interface SystemPage {
  slug: string
  name: string
  description: string | null
  icon: string | null
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

interface RoleWithPermissions {
  role: string
  userCount: number
  permissions: Record<string, PagePermissions>
}

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Данные роли (null если ещё не загружены) */
  role: RoleWithPermissions | null
  /** Список всех страниц системы */
  pages: SystemPage[]
  /** Флаг процесса сохранения */
  saving?: boolean
  /** Текущий пользователь — админ */
  isAdmin?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'save': [permissions: Record<string, PagePermissions>]
  'reset': []
}>()

// ============================================
// СЛОВАРИ РОЛЕЙ
// ============================================
const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Полный доступ ко всем функциям системы',
  manager: 'Управление объектами, финансами и персоналом',
  foreman: 'Руководство строительными работами',
  master: 'Выполнение работ на объектах',
  worker: 'Базовый доступ',
}

const ROLE_ICONS: Record<string, string> = {
  admin: 'mdi:shield-crown',
  manager: 'mdi:briefcase',
  foreman: 'mdi:hard-hat',
  master: 'mdi:wrench',
  worker: 'mdi:account-hard-hat',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg, #f25f5c 0%, #d63384 100%)',
  manager: 'linear-gradient(135deg, #f5a623 0%, #e67e22 100%)',
  foreman: 'linear-gradient(135deg, #3dd68c 0%, #28a745 100%)',
  master: 'linear-gradient(135deg, #00c3f5 0%, #0077b6 100%)',
  worker: 'linear-gradient(135deg, #9aa0b8 0%, #6c757d 100%)',
}

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ РЕДАКТИРУЕМЫХ ПРАВ
// ============================================
const localPermissions = ref<Record<string, PagePermissions>>({})
const expandedPages = ref(new Set<string>())

// ============================================
// COMPUTED: ДАННЫЕ РОЛИ
// ============================================
const roleName = computed(() =>
  ROLE_NAMES[props.role?.role || ''] || props.role?.role || ''
)
const roleDescription = computed(() =>
  ROLE_DESCRIPTIONS[props.role?.role || ''] || ''
)
const roleIcon = computed(() =>
  ROLE_ICONS[props.role?.role || ''] || 'mdi:account'
)
const roleColor = computed(() =>
  ROLE_COLORS[props.role?.role || ''] ||
  'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
)

// ============================================
// COMPUTED: СВОДКА ПРАВ (новая система: без canExport/canApprove)
// ============================================
const viewableCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canView).length
)
const createCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canCreate).length
)
const deleteCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canDelete).length
)
const specialCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canSpecial).length
)

// ============================================
// СИНХРОНИЗАЦИЯ: ПРИ ОТКРЫТИИ МОДАЛКИ КОПИРУЕМ ПРАВА
// ============================================
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen || !props.role) return

    // Создаём полную копию прав со всеми страницами
    const permissions: Record<string, PagePermissions> = {}
    for (const page of props.pages) {
      const existing = props.role.permissions[page.slug]
      permissions[page.slug] = {
        canView: existing?.canView ?? false,
        canCreate: existing?.canCreate ?? false,
        canEdit: existing?.canEdit ?? false,
        canDelete: existing?.canDelete ?? false,
        canSpecial: existing?.canSpecial ?? false,
      }
    }
    localPermissions.value = permissions
    expandedPages.value.clear()
  },
  { immediate: true }
)

// ============================================
// МЕТОДЫ
// ============================================

/**
 * Получить canView/canCreate/canEdit/canDelete/canSpecial для страницы
 */
function getPerm(pageSlug: string, key: keyof PagePermissions): boolean {
  return localPermissions.value[pageSlug]?.[key] ?? false
}

/**
 * Получить права без canView (для передачи в PermCheckboxes)
 * CanView управляется отдельным toggle-switch
 */
function getPermissionsWithoutView(pageSlug: string): Omit<PagePermissions, 'canView'> {
  const perms = localPermissions.value[pageSlug]
  if (!perms) {
    return { canCreate: false, canEdit: false, canDelete: false, canSpecial: false }
  }
  return {
    canCreate: perms.canCreate,
    canEdit: perms.canEdit,
    canDelete: perms.canDelete,
    canSpecial: perms.canSpecial,
  }
}

/**
 * Раскрыть/свернуть блок действий страницы
 */
function togglePageExpanded(slug: string) {
  if (expandedPages.value.has(slug)) {
    expandedPages.value.delete(slug)
  } else {
    expandedPages.value.add(slug)
  }
}

/**
 * Переключение canView через отдельный toggle
 * При выключении — сбрасываем все действия и сворачиваем блок
 */
function onToggleView(pageSlug: string) {
  const perms = localPermissions.value[pageSlug]
  if (!perms) return

  const newCanView = !perms.canView

  if (!newCanView) {
    // Сбрасываем все действия при выключении просмотра
    perms.canView = false
    perms.canCreate = false
    perms.canEdit = false
    perms.canDelete = false
    perms.canSpecial = false
    expandedPages.value.delete(pageSlug)
  } else {
    // Просто включаем просмотр
    perms.canView = true
    // Автоматически раскрываем блок для удобной настройки
    expandedPages.value.add(pageSlug)
  }
}

/**
 * Обновление действий (create/edit/delete/special) из PermCheckboxes
 * CanView остаётся неизменным (он управляется toggle-switch)
 */
function onActionsUpdate(
  pageSlug: string,
  actions: Omit<PagePermissions, 'canView'>
) {
  const perms = localPermissions.value[pageSlug]
  if (!perms) return

  perms.canCreate = actions.canCreate
  perms.canEdit = actions.canEdit
  perms.canDelete = actions.canDelete
  perms.canSpecial = actions.canSpecial
}

/**
 * Сохранение прав — эмитим в родителя
 */
function handleSave() {
  if (props.saving) return
  emit('save', { ...localPermissions.value })
}
</script>

<style lang="scss" scoped>
// ── ОВЕРЛЕЙ И КОНТЕЙНЕР ─────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-xl);
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);
}

// ── HEADER ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  p {
    margin: 0.25rem 0 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--crm-text-secondary);
  border: none;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.role-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: white;
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// ── BODY ────────────────────────────────────────────────
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-block {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  line-height: 1.4;

  > svg {
    color: var(--crm-info);
    flex-shrink: 0;
    margin-top: 2px;
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
}

.summary-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);

  > svg {
    color: var(--crm-text-muted);
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }

  &--special {
    svg { color: #9c27b0; }
    strong { color: #9c27b0; }
  }
}

// ── СПИСОК СТРАНИЦ ──────────────────────────────────────
.pages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-block {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
  }
}

.page-main {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.page-view-toggle {
  flex-shrink: 0;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  color: var(--crm-text-primary);

  > svg {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  h4 {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 500;
  }

  p {
    margin: 0.125rem 0 0;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.expand-icon {
  color: var(--crm-text-muted);
  flex-shrink: 0;
}

.page-actions {
  padding: 0.75rem 1rem 1rem 4rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-surface);
}

// ── TOGGLE SWITCH (для canView) ─────────────────────────
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: var(--crm-accent);

      &::before {
        transform: translateX(16px);
      }
    }

    &:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background: var(--crm-bg-overlay);
    border-radius: 20px;
    cursor: pointer;
    transition: var(--crm-transition);

    &::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: var(--crm-transition);
    }
  }
}

// ── FOOTER ──────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  flex-shrink: 0;

  .footer-spacer {
    flex: 1;
  }
}

// ── КНОПКИ ──────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--crm-accent);
  color: white;

  &:hover:not(:disabled) {
    background: var(--crm-accent-hover);
  }
}

.btn-secondary {
  background: var(--crm-bg-overlay);
  color: var(--crm-text-primary);
  border-color: var(--crm-border);

  &:hover:not(:disabled) {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--crm-text-secondary);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

// ── АНИМАЦИИ ────────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-content {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 768px) {
  .modal-content {
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .page-actions {
    padding-left: 1rem;
  }

  .summary-bar {
    flex-direction: column;
    gap: 0.375rem;
  }

  .modal-footer {
    flex-wrap: wrap;

    .footer-spacer {
      display: none;
    }

    .btn {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>