<!-- app/components/Layout/Cabinet/Header/ui/boards.vue -->
<template>
  <div class="boards-menu">

    <!-- ── Папки объектов ──────────────────────────────── -->
    <div class="boards-section">
      <div class="boards-section__header">
        <div class="boards-section__title">
          <Icon name="mdi:home-outline" size="14" />
          <span>Объекты</span>
        </div>
        <button class="boards-section__add" @click="openCreateFolderModal('objects')" title="Создать папку объектов">
          <Icon name="mdi:plus" size="16" />
        </button>
      </div>

      <!-- Загрузка -->
      <div v-if="foldersLoading" class="boards-loading">
        <Icon name="mdi:loading" class="spin" size="14" />
        <span>Загрузка...</span>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="objectsFolders.length === 0" class="boards-empty">
        Нет папок
      </div>

      <!-- Список папок -->
      <ul v-else class="folder-list">
        <li v-for="folder in objectsFolders" :key="`obj-${folder.id}`" class="folder-item"
          :class="{ 'folder-item--active': isActiveFolder(folder.id) }" @click="selectFolder(folder.id)">
          <Icon name="mdi:folder" size="16" class="folder-item__icon" />
          <span class="folder-item__name">{{ folder.name }}</span>
          <span class="folder-item__count">{{ getBoardsCount(folder.id) }}</span>
        </li>
      </ul>
    </div>

    <!-- ── Разделитель ─────────────────────────────────── -->
    <div class="boards-divider" />

    <!-- ── Общие папки ────────────────────────────────── -->
    <div class="boards-section">
      <div class="boards-section__header">
        <div class="boards-section__title">
          <Icon name="mdi:folder-outline" size="14" />
          <span>Общие доски</span>
        </div>
        <button class="boards-section__add" @click="openCreateFolderModal('general')" title="Создать общую папку">
          <Icon name="mdi:plus" size="16" />
        </button>
      </div>

      <div v-if="foldersLoading" class="boards-loading">
        <Icon name="mdi:loading" class="spin" size="14" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="generalFolders.length === 0" class="boards-empty">
        Нет папок
      </div>

      <ul v-else class="folder-list">
        <li v-for="folder in generalFolders" :key="`gen-${folder.id}`" class="folder-item"
          :class="{ 'folder-item--active': isActiveFolder(folder.id) }" @click="selectFolder(folder.id)">
          <Icon name="mdi:folder" size="16" class="folder-item__icon" />
          <span class="folder-item__name">{{ folder.name }}</span>
          <span class="folder-item__count">{{ getBoardsCount(folder.id) }}</span>
        </li>
      </ul>
    </div>

    <!-- ── Пустое состояние (обе секции пусты) ──────────── -->
    <div v-if="!foldersLoading && objectsFolders.length === 0 && generalFolders.length === 0" class="boards-zero">
      <Icon name="mdi:folder-open-outline" size="32" />
      <p>Нет папок с досками</p>
      <button class="boards-zero__btn" @click="openCreateFolderModal('objects')">
        + Создать папку
      </button>
    </div>

  </div>

  <!-- ── Модалка создания папки ───────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCreateFolderModal" class="modal-overlay" @click="closeCreateFolderModal">
        <div class="modal" @click.stop>

          <div class="modal__header">
            <h3 class="modal__title">Создать папку {{ folderTypeLabel }}</h3>
            <button class="modal__close" @click="closeCreateFolderModal">
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <div class="modal__body">
            <form @submit.prevent="handleCreateFolder" class="modal-form">

              <div class="form-field">
                <label class="form-field__label">Название папки *</label>
                <input v-model="newFolder.name" type="text" class="form-field__input" placeholder="Введите название"
                  required autofocus />
              </div>

              <div class="form-field">
                <label class="form-field__label">Описание</label>
                <textarea v-model="newFolder.description" class="form-field__input form-field__input--textarea"
                  placeholder="Необязательно" rows="2" />
              </div>

              <div class="form-divider">
                <span>Первая доска в папке</span>
              </div>

              <div class="form-field">
                <label class="form-field__label">Название доски *</label>
                <input v-model="newFolder.firstBoard.name" type="text" class="form-field__input"
                  placeholder="Введите название" required />
              </div>

              <div class="form-field">
                <label class="form-field__label">Описание доски</label>
                <textarea v-model="newFolder.firstBoard.description"
                  class="form-field__input form-field__input--textarea" placeholder="Необязательно" rows="2" />
              </div>

              <div class="form-field">
                <label class="form-field__label">Тип доски *</label>
                <select v-model="newFolder.firstBoard.type" class="form-field__input" required>
                  <option value="general">Общая доска</option>
                  <option value="object">Доска объекта</option>
                </select>
              </div>

              <div v-if="newFolder.firstBoard.type === 'object'" class="form-field">
                <label class="form-field__label">Объект *</label>
                <select v-model="newFolder.firstBoard.objectId" class="form-field__input" required>
                  <option value="">— Выберите объект —</option>
                  <option v-for="obj in availableObjects" :key="obj.id" :value="obj.id">
                    {{ obj.name }}{{ obj.address ? ` — ${truncateText(obj.address, 28)}` : '' }}
                  </option>
                </select>
                <div v-if="objectsLoading" class="form-field__hint">
                  <Icon name="mdi:loading" class="spin" size="12" /> Загрузка объектов...
                </div>
                <div v-if="objectsError" class="form-field__hint form-field__hint--error">
                  {{ objectsError }}
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="modal-btn modal-btn--secondary" @click="closeCreateFolderModal"
                  :disabled="creatingFolder">
                  Отмена
                </button>
                <button type="submit" class="modal-btn modal-btn--primary"
                  :disabled="creatingFolder || !canSubmitFolder">
                  <Icon v-if="creatingFolder" name="mdi:loading" class="spin" size="14" />
                  {{ creatingFolder ? 'Создание...' : 'Создать' }}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardFoldersStore } from 'stores/boards/folders'
import { useBoardsStore } from 'stores/boards'
import { useNotificationStore } from 'stores/notifications'
import { useApi } from '~/composables/useApi'
import type { CreateFolderForm } from '~/types/boards'

const emit = defineEmits<{ closeSidebar: [] }>()

const foldersStore = useBoardFoldersStore()
const boardsStore = useBoardsStore()
const notificationStore = useNotificationStore()
const router = useRouter()

// ── Состояние ──────────────────────────────────────────────────────
const showCreateFolderModal = ref(false)
const creatingFolder = ref(false)
const folderType = ref<'objects' | 'general'>('general')
const foldersLoading = ref(false)

const newFolder = ref<CreateFolderForm>({
  name: '',
  description: '',
  category: 'general',
  firstBoard: { name: '', description: '', type: 'general', objectId: null }
})

const availableObjects = ref<any[]>([])
const objectsLoading = ref(false)
const objectsError = ref<string | null>(null)

// ── Computed ───────────────────────────────────────────────────────
const objectsFolders = computed(() =>
  foldersStore.allFolders
    .filter(f => f.category === 'objects')
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
)

const generalFolders = computed(() =>
  foldersStore.allFolders
    .filter(f => f.category === 'general')
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
)

const folderTypeLabel = computed(() =>
  folderType.value === 'objects' ? 'объектов' : 'общих досок'
)

const canSubmitFolder = computed(() => {
  const f = newFolder.value as CreateFolderForm
  const fb = f.firstBoard
  if (!fb) return false
  return (
    f.name.trim().length > 0 &&
    (fb.name ?? '').trim().length > 0 &&
    (fb.type !== 'object' || !!fb.objectId)
  )
})

// ── Методы ────────────────────────────────────────────────────────
const isActiveFolder = (id: number) => foldersStore.activeFolderId === id
const getBoardsCount = (id: number) => boardsStore.allBoards.filter(b => b.folderId === id).length
const truncateText = (text: string, max: number) =>
  text.length > max ? text.substring(0, max) + '…' : text

async function selectFolder(folderId: number) {
  foldersStore.selectFolder(folderId)
  try {
    await foldersStore.fetchBoardsInFolder(folderId)
    const boards = boardsStore.allBoards.filter(b => b.folderId === folderId)

    // ✅ Проверяем первый элемент явно
    const firstBoard = boards[0]
    if (firstBoard) {
      boardsStore.selectBoard(firstBoard.id)
      router.push('/cabinet/boards')
      emit('closeSidebar')
    } else {
      notificationStore.warning('В папке нет досок')
    }
  } catch {
    notificationStore.error('Не удалось загрузить доски папки')
  }
}

function openCreateFolderModal(type: 'objects' | 'general') {
  folderType.value = type
  newFolder.value = {
    name: '',
    description: '',
    category: type,
    firstBoard: {
      name: '',
      description: '',
      type: type === 'objects' ? 'object' : 'general',
      objectId: null
    }
  }
  if (type === 'objects' && availableObjects.value.length === 0) fetchObjects()
  showCreateFolderModal.value = true
}

function closeCreateFolderModal() {
  showCreateFolderModal.value = false
}

async function handleCreateFolder() {
  if (!canSubmitFolder.value) return
  creatingFolder.value = true
  try {
    // ✅ Используем ! — firstBoard всегда инициализирован при создании ref
    const firstBoardData = newFolder.value.firstBoard as NonNullable<typeof newFolder.value.firstBoard>

    const result = await foldersStore.createFolderWithBoard({
      folder: {
        name: newFolder.value.name.trim(),
        description: newFolder.value.description.trim() || undefined,
        category: newFolder.value.category
      },
      firstBoard: {
        name: firstBoardData.name.trim(),
        description: firstBoardData.description?.trim() || undefined,
        type: firstBoardData.type,
        objectId: firstBoardData.objectId ?? undefined
      }
    })

    if (result?.folder?.id && result?.board?.id) {
      notificationStore.success(`Папка "${result.folder.name}" создана`)
      await selectFolder(result.folder.id)
    } else {
      notificationStore.error('Не удалось создать папку или доску')
    }
    closeCreateFolderModal()
  } catch (e: any) {
    notificationStore.error(e?.data?.message || 'Не удалось создать папку')
  } finally {
    creatingFolder.value = false
  }
}

async function fetchFolders() {
  foldersLoading.value = true
  try {
    await foldersStore.fetchFolders()
    await boardsStore.fetchBoards()
  } catch {
    console.error('[Доски] Ошибка загрузки папок')
  } finally {
    foldersLoading.value = false
  }
}

async function fetchObjects() {
  objectsLoading.value = true
  objectsError.value = null
  try {
    const api = useApi()
    const res = await api.get<any[]>('/api/objects')
    availableObjects.value = Array.isArray(res) ? res : []
  } catch {
    objectsError.value = 'Не удалось загрузить объекты'
  } finally {
    objectsLoading.value = false
  }
}

onMounted(() => {
  if (foldersStore.allFolders.length === 0) fetchFolders()
  else if (boardsStore.allBoards.length === 0) boardsStore.fetchBoards()
})
</script>

<style lang="scss" scoped>
// ── Основной контейнер ──────────────────────────────────────────────
.boards-menu {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

// ── Секция ─────────────────────────────────────────────────────────
.boards-section {
  padding: 0 8px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 6px 4px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--crm-text-muted);
  }

  &__add {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--crm-radius-sm);
    color: var(--crm-text-muted);
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-accent-dim);
      border-color: var(--crm-accent-border);
      color: var(--crm-accent);
    }
  }
}

// ── Разделитель ────────────────────────────────────────────────────
.boards-divider {
  height: 1px;
  background: var(--crm-border);
  margin: 6px 16px;
}

// ── Список папок ───────────────────────────────────────────────────
.folder-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: var(--crm-transition);
  color: var(--crm-text-secondary);

  &__icon {
    color: var(--crm-accent);
    flex-shrink: 0;
    opacity: .7;
    transition: var(--crm-transition);
  }

  &__name {
    flex: 1;
    font-size: var(--crm-text-md);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: inherit;
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    padding: 1px 6px;
    background: var(--crm-bg-overlay);
    border-radius: 10px;
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &:hover {
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);

    .folder-item__icon {
      opacity: 1;
    }
  }

  &--active {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);

    .folder-item__icon {
      opacity: 1;
      color: var(--crm-accent);
    }

    .folder-item__count {
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
    }

    &:hover {
      background: var(--crm-accent-dim);
    }
  }
}

// ── Вспомогательные состояния ──────────────────────────────────────
.boards-loading,
.boards-empty {
  padding: 8px 10px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.boards-zero {
  padding: 20px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--crm-text-muted);

  p {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
    margin: 0;
  }

  &__btn {
    margin-top: 4px;
    padding: 6px 14px;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    font-size: var(--crm-text-sm);
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}

// ── Спиннер ────────────────────────────────────────────────────────
.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// ── Модалка ────────────────────────────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  backdrop-filter: blur(3px);
}

.modal {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-xl);
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--crm-shadow-lg);
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0;
  }

  &__close {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-muted);
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-danger-dim);
      border-color: rgba(242, 95, 92, 0.3);
      color: var(--crm-danger);
    }
  }

  &__body {
    padding: 20px;
  }
}

// ── Форма ──────────────────────────────────────────────────────────
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-md);
    font-family: var(--crm-font-sans);
    padding: 8px 12px;
    outline: none;
    transition: var(--crm-transition);
    width: 100%;

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--textarea {
      resize: vertical;
      min-height: 60px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }

  &__hint {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    display: flex;
    align-items: center;
    gap: 4px;

    &--error {
      color: var(--crm-danger);
    }
  }
}

.form-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0;

  span {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--crm-border);
  }
}

// ── Кнопки модалки ─────────────────────────────────────────────────
.modal-actions {
  display: flex;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--crm-border);
  margin-top: 4px;
}

.modal-btn {
  flex: 1;
  padding: 9px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-md);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: var(--crm-transition);

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-accent);
    border: 1px solid var(--crm-accent);
    color: #000;

    &:hover:not(:disabled) {
      background: var(--crm-accent-hover);
    }
  }

  &--secondary {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }
}

// ── Анимация модалки ───────────────────────────────────────────────
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity .2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>