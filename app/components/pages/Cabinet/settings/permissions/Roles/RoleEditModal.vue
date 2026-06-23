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
            <div class="header-actions">
              <button
                class="btn-icon"
                @click="showMenuPreview = !showMenuPreview"
                :title="showMenuPreview ? 'Скрыть предпросмотр меню' : 'Показать предпросмотр меню'"
              >
                <Icon :name="showMenuPreview ? 'mdi:eye-off' : 'mdi:eye'" size="18" />
              </button>
              <button
                class="btn-close"
                @click="$emit('update:isOpen', false)"
                :disabled="saving"
              >
                <Icon name="mdi:close" size="20" />
              </button>
            </div>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Информация -->
            <div class="info-block">
              <Icon name="mdi:information-outline" size="18" />
              <span>
                Раздел автоматически появится в меню пользователя, если включено
                <strong>хотя бы одно действие</strong> (создание, редактирование, удаление или спец. операция).
                Для разделов «только просмотр» доступ определяется наличием записи в системе.
              </span>
            </div>

            <!-- Сводка -->
            <div class="summary-bar">
              <span class="summary-item">
                <Icon name="mdi:eye" size="16" />
                Видимо в меню: <strong>{{ visibleCount }}</strong> / {{ pages.length }}
              </span>
              <span class="summary-item">
                <Icon name="mdi:plus-circle" size="16" />
                Создание: <strong>{{ createCount }}</strong>
              </span>
              <span class="summary-item">
                <Icon name="mdi:pencil" size="16" />
                Ред.: <strong>{{ editCount }}</strong>
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

            <!-- Прогресс покрытия -->
            <div class="coverage-bar-wrapper">
              <div class="coverage-bar">
                <div
                  class="coverage-fill"
                  :style="{ width: `${coveragePercent}%` }"
                ></div>
              </div>
              <span class="coverage-text">
                Покрытие: {{ coveragePercent }}% ({{ visibleCount }} из {{ pages.length }} разделов)
              </span>
            </div>

            <!-- 🆕 ПРЕДПРОСМОТР МЕНЮ ПОЛЬЗОВАТЕЛЯ -->
            <Transition name="expand">
              <div v-if="showMenuPreview" class="menu-preview-section">
                <div class="menu-preview-header">
                  <Icon name="mdi:view-sidebar" size="18" />
                  <span>Как будет выглядеть меню для роли «{{ roleName }}»</span>
                </div>
                <div v-if="visiblePages.length === 0" class="menu-preview-empty">
                  <Icon name="mdi:eye-off" size="32" />
                  <p>Меню будет пустым — включите хотя бы одно действие для любого раздела</p>
                </div>
                <div v-else class="menu-preview-list">
                  <div
                    v-for="page in visiblePages"
                    :key="page.slug"
                    class="menu-preview-item"
                  >
                    <Icon :name="page.icon || 'mdi:file-outline'" size="18" />
                    <span class="menu-preview-item-name">{{ page.name }}</span>
                    <div class="menu-preview-item-actions">
                      <Icon
                        v-if="getPerm(page.slug, 'canCreate')"
                        name="mdi:plus-circle"
                        size="12"
                        title="Создание"
                        class="action-icon action-icon--create"
                      />
                      <Icon
                        v-if="getPerm(page.slug, 'canEdit')"
                        name="mdi:pencil"
                        size="12"
                        title="Редактирование"
                        class="action-icon action-icon--edit"
                      />
                      <Icon
                        v-if="getPerm(page.slug, 'canDelete')"
                        name="mdi:delete"
                        size="12"
                        title="Удаление"
                        class="action-icon action-icon--delete"
                      />
                      <Icon
                        v-if="getPerm(page.slug, 'canSpecial')"
                        name="mdi:lightning-bolt"
                        size="12"
                        title="Спец. операции"
                        class="action-icon action-icon--special"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- 🆕 БЛОК AUDIT (последние изменения) -->
            <div v-if="role?.role" class="audit-block">
              <Icon name="mdi:history" size="14" />
              <span class="audit-text">
                Роль имеет <strong>{{ role.userCount }}</strong>
                {{ pluralizeUsers(role.userCount) }}.
                Изменения применяются мгновенно для всех.
              </span>
            </div>

            <!-- Индикатор изменений -->
            <Transition name="fade">
              <div v-if="hasUnsavedChanges" class="unsaved-changes-banner">
                <Icon name="mdi:pencil-circle" size="16" />
                <span>Есть несохранённые изменения</span>
                <button class="btn-text" @click="resetChanges">
                  Отменить все
                </button>
              </div>
            </Transition>

            <!-- Список страниц -->
            <div class="pages-list">
              <div
                v-for="page in pages"
                :key="page.slug"
                :class="['page-block', {
                  'page-block--modified': isPageModified(page.slug),
                  'page-block--critical': isCriticalRevocation(page.slug),
                  'page-block--visible': isPageVisible(page.slug),
                  'page-block--view-only': isViewOnlyPage(page)
                }]"
              >
                <!-- Заголовок страницы -->
                <div class="page-header">
                  <div class="page-main">
                    <!-- Индикатор изменений -->
                    <div
                      v-if="isPageModified(page.slug)"
                      class="page-modified-indicator"
                      title="Права этой страницы изменены"
                    >
                      <Icon name="mdi:circle-small" size="20" />
                    </div>

                    <!-- Индикатор видимости (для CRUD страниц — клик переключает всё) -->
                    <div
                      v-if="!isViewOnlyPage(page)"
                      class="page-visibility-toggle"
                      @click="togglePageVisibility(page.slug)"
                      :title="isPageVisible(page.slug) ? 'Выключить все действия' : 'Включить базовый набор действий'"
                    >
                      <label class="toggle-switch" @click.stop>
                        <input
                          type="checkbox"
                          :checked="isPageVisible(page.slug)"
                          :disabled="saving"
                          @change="togglePageVisibility(page.slug)"
                        />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>

                    <!-- Для view-only страниц — статичный индикатор -->
                    <div v-else class="page-visibility-indicator view-only">
                      <Icon name="mdi:eye-outline" size="16" />
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

                  <!-- Правая часть: тег capabilities + бейдж критичности -->
                  <div class="page-header-right">
                    <!-- 🆕 Бейдж критичности -->
                    <span
                      v-if="isCriticalRevocation(page.slug)"
                      class="critical-badge"
                      title="Отключение доступа приведёт к разлогину пользователей"
                    >
                      <Icon name="mdi:alert" size="12" />
                      Критично
                    </span>

                    <!-- Для view-only страниц — специальный бейдж -->
                    <span v-if="isViewOnlyPage(page)" class="view-only-badge">
                      <Icon name="mdi:eye-outline" size="12" />
                      Только просмотр
                    </span>

                    <PagesCabinetSettingsPermissionsSharedPermCapabilities
                      v-else-if="isPageVisible(page.slug)"
                      :page="page"
                      compact
                    />
                  </div>
                </div>

                <!-- Действия (только для CRUD страниц) -->
                <div
                  v-if="!isViewOnlyPage(page)"
                  class="page-actions"
                >
                  <PagesCabinetSettingsPermissionsSharedPermCheckboxes
                    :model-value="getPagePermissions(page.slug)"
                    :page="page"
                    :disabled="saving"
                    @update:model-value="(val: any) => onActionsUpdate(page.slug, val)"
                  />

                  <!-- 🆕 Сравнение с исходными правами -->
                  <div v-if="isPageModified(page.slug)" class="page-changes-hint">
                    <Icon name="mdi:information-outline" size="14" />
                    <span>
                      Было:
                      <code>{{ formatOriginalPerms(page.slug) }}</code>
                    </span>
                  </div>
                </div>

                <!-- Для view-only страниц — информационная плашка -->
                <div v-else class="page-view-only-info">
                  <Icon name="mdi:information-outline" size="14" />
                  <span>
                    Этот раздел всегда виден пользователям с данной ролью.
                    Действий для настройки нет.
                  </span>
                </div>
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
              :disabled="saving || !hasUnsavedChanges"
            >
              <Icon v-if="saving" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:content-save" size="16" />
              {{ saving ? 'Сохранение...' : (hasUnsavedChanges ? 'Сохранить изменения' : 'Нет изменений') }}
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
// КОНСТАНТЫ
// ============================================

const CRITICAL_PAGES = ['dashboard', 'objects', 'works']

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
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================

const localPermissions = ref<Record<string, PagePermissions>>({})
const originalPermissions = ref<Record<string, PagePermissions>>({})
const showMenuPreview = ref(false)

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
// ХЕЛПЕРЫ: ОПРЕДЕЛЕНИЕ ТИПА СТРАНИЦЫ
// ============================================

/**
 * View-only страница — поддерживает только просмотр (dashboard, online, test)
 * У таких страниц нет CRUD-действий, они видимы всегда при наличии записи в БД
 */
function isViewOnlyPage(page: SystemPage): boolean {
  return !page.hasCreate && !page.hasEdit && !page.hasDelete && !page.hasSpecial
}

/**
 * Страница видима в меню, если включено хотя бы одно действие.
 * View-only страницы видимы всегда (если есть в списке).
 */
function isPageVisible(pageSlug: string): boolean {
  const page = props.pages.find(p => p.slug === pageSlug)
  if (!page) return false

  if (isViewOnlyPage(page)) {
    // View-only страница — всегда видима
    return true
  }

  // CRUD страница — видима если есть хотя бы одно действие
  const perms = localPermissions.value[pageSlug]
  if (!perms) return false
  return perms.canCreate || perms.canEdit || perms.canDelete || perms.canSpecial
}

// ============================================
// COMPUTED: СВОДКА ПРАВ
// ============================================

const visibleCount = computed(() =>
  props.pages.filter(p => isPageVisible(p.slug)).length
)

const createCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canCreate).length
)

const editCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canEdit).length
)

const deleteCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canDelete).length
)

const specialCount = computed(() =>
  Object.values(localPermissions.value).filter(p => p.canSpecial).length
)

const coveragePercent = computed(() => {
  if (props.pages.length === 0) return 0
  return Math.round((visibleCount.value / props.pages.length) * 100)
})

/**
 * Страницы, которые будут видны в меню пользователя
 */
const visiblePages = computed(() =>
  props.pages.filter(p => isPageVisible(p.slug))
)

/**
 * Есть ли несохранённые изменения
 */
const hasUnsavedChanges = computed(() => {
  for (const slug of Object.keys(localPermissions.value)) {
    if (isPageModified(slug)) return true
  }
  return false
})

// ============================================
// СИНХРОНИЗАЦИЯ: ПРИ ОТКРЫТИИ МОДАЛКИ КОПИРУЕМ ПРАВА
// ============================================

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen || !props.role) return

    const permissions: Record<string, PagePermissions> = {}
    for (const page of props.pages) {
      const existing = props.role.permissions[page.slug]
      permissions[page.slug] = {
        canCreate: existing?.canCreate ?? false,
        canEdit: existing?.canEdit ?? false,
        canDelete: existing?.canDelete ?? false,
        canSpecial: existing?.canSpecial ?? false,
      }
    }
    localPermissions.value = permissions
    originalPermissions.value = JSON.parse(JSON.stringify(permissions))
    showMenuPreview.value = false
  },
  { immediate: true }
)

// ============================================
// МЕТОДЫ
// ============================================

function getPerm(pageSlug: string, key: keyof PagePermissions): boolean {
  return localPermissions.value[pageSlug]?.[key] ?? false
}

function getPagePermissions(pageSlug: string): PagePermissions {
  return localPermissions.value[pageSlug] || {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canSpecial: false,
  }
}

/**
 * Переключение видимости страницы (toggle всех действий)
 *
 * Логика:
 * - Если страница видима (есть действия) — выключаем все действия
 * - Если страница невидима — включаем базовый набор (create + edit, если поддерживаются)
 */
function togglePageVisibility(pageSlug: string) {
  const page = props.pages.find(p => p.slug === pageSlug)
  if (!page || isViewOnlyPage(page)) return

  const perms = localPermissions.value[pageSlug]
  if (!perms) return

  const isVisible = perms.canCreate || perms.canEdit || perms.canDelete || perms.canSpecial

  if (isVisible) {
    // Выключаем все действия
    perms.canCreate = false
    perms.canEdit = false
    perms.canDelete = false
    perms.canSpecial = false
  } else {
    // Включаем базовый набор действий (только те, что поддерживает страница)
    perms.canCreate = page.hasCreate
    perms.canEdit = page.hasEdit
    // delete и special по умолчанию выключаем — это более опасные действия
    perms.canDelete = false
    perms.canSpecial = false
  }
}

function onActionsUpdate(
  pageSlug: string,
  actions: PagePermissions
) {
  const perms = localPermissions.value[pageSlug]
  if (!perms) return
  perms.canCreate = actions.canCreate
  perms.canEdit = actions.canEdit
  perms.canDelete = actions.canDelete
  perms.canSpecial = actions.canSpecial
}

/**
 * Проверить, изменены ли права страницы относительно исходных
 */
function isPageModified(pageSlug: string): boolean {
  const current = localPermissions.value[pageSlug]
  const original = originalPermissions.value[pageSlug]
  if (!current || !original) return false
  return (
    current.canCreate !== original.canCreate ||
    current.canEdit !== original.canEdit ||
    current.canDelete !== original.canDelete ||
    current.canSpecial !== original.canSpecial
  )
}

/**
 * Проверить, является ли изменение критичным
 * (отключение всех действий у критической страницы, где раньше было хотя бы одно)
 */
function isCriticalRevocation(pageSlug: string): boolean {
  if (!CRITICAL_PAGES.includes(pageSlug)) return false
  const current = localPermissions.value[pageSlug]
  const original = originalPermissions.value[pageSlug]
  if (!current || !original) return false

  const wasVisible = original.canCreate || original.canEdit || original.canDelete || original.canSpecial
  const isNowVisible = current.canCreate || current.canEdit || current.canDelete || current.canSpecial

  return wasVisible && !isNowVisible
}

/**
 * Форматировать исходные права для отображения в подсказке
 */
function formatOriginalPerms(pageSlug: string): string {
  const original = originalPermissions.value[pageSlug]
  if (!original) return '—'
  const parts: string[] = []
  if (original.canCreate) parts.push('➕')
  if (original.canEdit) parts.push('✏')
  if (original.canDelete) parts.push('🗑')
  if (original.canSpecial) parts.push('⚡')
  return parts.length > 0 ? parts.join(' ') : 'нет прав'
}

/**
 * Сбросить все изменения к исходным
 */
function resetChanges() {
  localPermissions.value = JSON.parse(JSON.stringify(originalPermissions.value))
}

function handleSave() {
  if (props.saving || !hasUnsavedChanges.value) return
  emit('save', { ...localPermissions.value })
}

function pluralizeUsers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователя'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователей'
  return 'пользователей'
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
  max-width: 760px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-close,
.btn-icon {
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

// ── ПРОГРЕСС ПОКРЫТИЯ ───────────────────────────────────
.coverage-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.coverage-bar {
  height: 6px;
  background: var(--crm-bg-elevated);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--crm-border);

  .coverage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--crm-accent) 0%, var(--crm-success) 100%);
    border-radius: 3px;
    transition: width 0.4s ease;
  }
}

.coverage-text {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// ── ПРЕДПРОСМОТР МЕНЮ ───────────────────────────────────
.menu-preview-section {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;
}

.menu-preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--crm-bg-overlay);
  border-bottom: 1px solid var(--crm-border);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-primary);

  svg {
    color: var(--crm-accent);
  }
}

.menu-preview-empty {
  padding: 2rem;
  text-align: center;
  color: var(--crm-text-muted);

  svg {
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
  }
}

.menu-preview-list {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-preview-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
  }

  > svg:first-child {
    color: var(--crm-accent);
    flex-shrink: 0;
  }
}

.menu-preview-item-name {
  flex: 1;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-primary);
  font-weight: 500;
}

.menu-preview-item-actions {
  display: flex;
  gap: 0.375rem;
}

.action-icon {
  opacity: 0.7;

  &--create { color: var(--crm-success); }
  &--edit { color: var(--crm-info); }
  &--delete { color: var(--crm-danger); }
  &--special { color: #9c27b0; }
}

// ── AUDIT БЛОК ──────────────────────────────────────────
.audit-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);

  svg {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  .audit-text {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);

    strong {
      color: var(--crm-text-secondary);
      font-weight: 600;
    }
  }
}

// ── БАННЕР НЕСОХРАНЁННЫХ ИЗМЕНЕНИЙ ─────────────────────
.unsaved-changes-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--crm-warning-dim);
  border: 1px solid rgba(245, 166, 35, 0.3);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  color: var(--crm-warning);

  svg {
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }
}

.btn-text {
  background: transparent;
  border: none;
  color: var(--crm-warning);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  font-family: var(--crm-font-sans);
  cursor: pointer;
  text-decoration: underline;
  padding: 0.25rem 0.5rem;
  border-radius: var(--crm-radius-sm);
  transition: all var(--crm-transition);

  &:hover {
    background: rgba(245, 166, 35, 0.15);
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
  transition: all var(--crm-transition);

  &--modified {
    border-color: var(--crm-warning);
    border-left: 3px solid var(--crm-warning);
  }

  &--critical {
    border-color: var(--crm-danger);
    border-left: 3px solid var(--crm-danger);
  }

  &--visible:not(&--modified):not(&--critical) {
    border-left: 3px solid var(--crm-success);
  }

  &--view-only {
    opacity: 0.85;
    background: var(--crm-bg-surface);
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  transition: background var(--crm-transition);
}

.page-main {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.page-modified-indicator {
  color: var(--crm-warning);
  flex-shrink: 0;
  animation: pulse-indicator 1.5s ease-in-out infinite;
}

@keyframes pulse-indicator {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.page-visibility-toggle {
  flex-shrink: 0;
  cursor: pointer;
}

.page-visibility-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--crm-bg-overlay);
  color: var(--crm-text-muted);
  border: 1px dashed var(--crm-border);

  &.view-only {
    background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
    color: var(--crm-info);
    border-style: solid;
    border-color: rgba(0, 195, 245, 0.2);
  }
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

.critical-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: var(--crm-danger-dim);
  color: var(--crm-danger);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  white-space: nowrap;
  animation: pulse-critical 2s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.view-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
  color: var(--crm-info);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  white-space: nowrap;
}

.page-actions {
  padding: 0.75rem 1rem 1rem 4rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-surface);
}

.page-view-only-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem 0.875rem 4rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-surface);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  svg {
    color: var(--crm-info);
    flex-shrink: 0;
  }
}

.page-changes-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
  padding: 0.375rem 0.625rem;
  background: var(--crm-warning-dim);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  color: var(--crm-warning);

  svg {
    flex-shrink: 0;
  }

  code {
    font-family: var(--crm-font-mono);
    background: rgba(245, 166, 35, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: var(--crm-radius-sm);
  }
}

// ── TOGGLE SWITCH ───────────────────────────────────────
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
      background: var(--crm-success);

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

  .page-actions,
  .page-view-only-info {
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