<!-- app/components/Layout/Cabinet/Header/ui/boards.vue -->
<template>
  <ul>
    <!-- Папки объектов -->
    <li class="boards-section">
      <div class="boards-section-header">
        <div class="boards-section-title">
          <Icon name="mdi:home-outline" />
          <span>Доски объектов</span>
        </div>
        <button class="boards-section-add-btn" @click="openCreateFolderModal('objects')"
          title="Создать папку досок объектов">
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>

      <div v-if="foldersLoading" class="boards-loading">
        <Icon name="mdi:loading" class="loading-icon" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="objectsFolders.length === 0" class="boards-empty-state">
        <p>Нет папок</p>
      </div>

      <ul v-else class="boards-list">
        <li v-for="folder in objectsFolders" :key="`folder-${folder.id}`" class="board-item folder-item"
          :class="{ active: isActiveFolder(folder.id) }" @click="selectFolder(folder.id)">
          <div class="board-link folder-link">
            <Icon name="mdi:folder" class="board-icon folder-icon" />
            <span class="board-name folder-name">{{ folder.name }}</span>
            <span class="board-count folder-count">{{ getBoardsCount(folder.id) }}</span>
          </div>
        </li>
      </ul>
    </li>

    <!-- Разделитель -->
    <li v-if="objectsFolders.length > 0 && generalFolders.length > 0" class="divider">
      <hr />
    </li>

    <!-- Общие папки -->
    <li class="boards-section">
      <div class="boards-section-header">
        <div class="boards-section-title">
          <Icon name="mdi:folder-outline" />
          <span>Общие доски</span>
        </div>
        <button class="boards-section-add-btn" @click="openCreateFolderModal('general')"
          title="Создать папку общих досок">
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>

      <div v-if="foldersLoading" class="boards-loading">
        <Icon name="mdi:loading" class="loading-icon" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="generalFolders.length === 0" class="boards-empty-state">
        <p>Нет папок</p>
      </div>

      <ul v-else class="boards-list">
        <li v-for="folder in generalFolders" :key="`folder-${folder.id}`" class="board-item folder-item"
          :class="{ active: isActiveFolder(folder.id) }" @click="selectFolder(folder.id)">
          <div class="board-link folder-link">
            <Icon name="mdi:folder" class="board-icon folder-icon" />
            <span class="board-name folder-name">{{ folder.name }}</span>
            <span class="board-count folder-count">{{ getBoardsCount(folder.id) }}</span>
          </div>
        </li>
      </ul>
    </li>

    <!-- Пустое состояние -->
    <li v-if="objectsFolders.length === 0 && generalFolders.length === 0 && !foldersLoading" class="boards-empty">
      <Icon name="mdi:folder-open-outline" size="48" />
      <p>Нет папок с досками</p>
      <div class="boards-empty-actions">
        <button @click="openCreateFolderModal('objects')" class="create-board-btn object">
          Создать папку объектов
        </button>
        <button @click="openCreateFolderModal('general')" class="create-board-btn general">
          Создать папку общих досок
        </button>
      </div>
    </li>
  </ul>

  <!-- Модалка создания папки через Teleport -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCreateFolderModal" class="modal-overlay" @click="closeCreateFolderModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Создать папку {{ folderTypeLabel }}</h3>
            <button class="modal-close" @click="closeCreateFolderModal" aria-label="Закрыть">
              <Icon name="mdi:close" size="24" />
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleCreateFolder" class="create-folder-form">
              <div class="form-group">
                <label for="folder-name">Название папки *</label>
                <input id="folder-name" v-model="newFolder.name" type="text" class="form-control"
                  placeholder="Введите название папки" required autofocus />
              </div>

              <div class="form-group">
                <label for="folder-description">Описание</label>
                <textarea id="folder-description" v-model="newFolder.description" class="form-control"
                  placeholder="Описание папки (необязательно)" rows="2"></textarea>
              </div>

              <!-- Первая доска в папке -->
              <div class="form-group section-divider">
                <h4>Первая доска в папке</h4>
                <p class="section-description">При создании папки автоматически создастся первая доска</p>
              </div>

              <div class="form-group">
                <label for="first-board-name">Название доски *</label>
                <input id="first-board-name" v-model="newFolder.firstBoard.name" type="text" class="form-control"
                  placeholder="Введите название доски" required />
              </div>

              <div class="form-group">
                <label for="first-board-description">Описание доски</label>
                <textarea id="first-board-description" v-model="newFolder.firstBoard.description" class="form-control"
                  placeholder="Описание доски (необязательно)" rows="2"></textarea>
              </div>

              <div class="form-group">
                <label for="first-board-type">Тип доски *</label>
                <select id="first-board-type" v-model="newFolder.firstBoard.type" class="form-control" required>
                  <option value="general">Общая доска</option>
                  <option value="object">Доска объекта</option>
                </select>
              </div>

              <div v-if="newFolder.firstBoard.type === 'object'" class="form-group">
                <label for="first-board-object">Выберите объект *</label>
                <select id="first-board-object" v-model="newFolder.firstBoard.objectId" class="form-control" required>
                  <option value="">-- Выберите объект --</option>
                  <option v-for="obj in availableObjects" :key="obj.id" :value="obj.id">
                    {{ obj.name }} {{ obj.address ? `— ${truncateText(obj.address, 30)}` : '' }}
                  </option>
                </select>
                <div v-if="objectsLoading" class="objects-loading">
                  <Icon name="mdi:loading" class="loading-icon" />
                  <span>Загрузка объектов...</span>
                </div>
                <div v-else-if="objectsError" class="objects-error">
                  <span class="error-text">{{ objectsError }}</span>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" @click="closeCreateFolderModal"
                  :disabled="creatingFolder">
                  Отмена
                </button>
                <button type="submit" class="btn btn-primary" :disabled="creatingFolder || !canSubmitFolder">
                  <span v-if="creatingFolder">
                    <Icon name="mdi:loading" class="btn-icon spin" />
                    Создание...
                  </span>
                  <span v-else>Создать папку</span>
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
import type { BoardFolder } from '~/types/boards'

// Emits
const emit = defineEmits<{
  closeSidebar: []
}>()

// Stores
const foldersStore = useBoardFoldersStore()
const boardsStore = useBoardsStore()
const notificationStore = useNotificationStore()
const router = useRouter()

// State
const showCreateFolderModal = ref(false)
const creatingFolder = ref(false)
const folderType = ref<'objects' | 'general'>('general')
const foldersLoading = ref(false)

// State для формы создания папки
const newFolder = ref({
  name: '',
  description: '',
  category: 'general' as 'objects' | 'general',
  firstBoard: {
    name: '',
    description: '',
    type: 'general' as 'object' | 'general',
    objectId: null as number | null
  }
})

// State для объектов
const availableObjects = ref<any[]>([])
const objectsLoading = ref(false)
const objectsError = ref<string | null>(null)

// Computed
const objectsFolders = computed(() => {
  return foldersStore.allFolders.filter(f => f.category === 'objects')
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

const generalFolders = computed(() => {
  return foldersStore.allFolders.filter(f => f.category === 'general')
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

const folderTypeLabel = computed(() => {
  return folderType.value === 'objects' ? 'объектов' : 'общих досок'
})

const canSubmitFolder = computed(() => {
  const nameValid = newFolder.value.name.trim().length > 0
  const boardNameValid = newFolder.value.firstBoard.name.trim().length > 0
  const objectValid = newFolder.value.firstBoard.type !== 'object' ||
    !!newFolder.value.firstBoard.objectId
  return nameValid && boardNameValid && objectValid
})

// Methods
const isActiveFolder = (folderId: number) => {
  return foldersStore.activeFolderId === folderId
}

const getBoardsCount = (folderId: number) => {
  return boardsStore.allBoards.filter(b => b.folderId === folderId).length
}

const selectFolder = async (folderId: number) => {
  // Устанавливаем активную папку
  foldersStore.selectFolder(folderId)

  // Загружаем доски папки
  try {
    await foldersStore.fetchBoardsInFolder(folderId)

    // Получаем доски текущей папки
    const boardsInFolder = boardsStore.allBoards.filter(b => b.folderId === folderId)

    // Выбираем первую доску
    if (boardsInFolder.length > 0) {
      const firstBoard = boardsInFolder[0]
      boardsStore.selectBoard(firstBoard.id)

      // Переходим в канбан
      router.push('/cabinet/boards')
      emit('closeSidebar')
    } else {
      notificationStore.warning('В папке нет досок')
    }
  } catch (error) {
    console.error('Ошибка загрузки досок папки:', error)
    notificationStore.error('Не удалось загрузить доски папки')
  }
}

const openCreateFolderModal = (type: 'objects' | 'general') => {
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

  // Загружаем объекты если нужно
  if (type === 'objects' && availableObjects.value.length === 0) {
    fetchObjects()
  }

  showCreateFolderModal.value = true
  // Фокус на поле ввода при открытии
  setTimeout(() => {
    const input = document.getElementById('folder-name') as HTMLInputElement
    input?.focus()
  }, 100)
}

const closeCreateFolderModal = () => {
  showCreateFolderModal.value = false
  newFolder.value = {
    name: '',
    description: '',
    category: 'general',
    firstBoard: {
      name: '',
      description: '',
      type: 'general',
      objectId: null
    }
  }
}

const handleCreateFolder = async () => {
  if (!canSubmitFolder.value) return

  creatingFolder.value = true
  try {
    const result = await foldersStore.createFolderWithBoard({
      folder: {
        name: newFolder.value.name.trim(),
        description: newFolder.value.description.trim() || undefined,
        category: newFolder.value.category
      },
      firstBoard: {
        name: newFolder.value.firstBoard.name.trim(),
        description: newFolder.value.firstBoard.description.trim() || undefined,
        type: newFolder.value.firstBoard.type,
        objectId: newFolder.value.firstBoard.objectId || undefined
      }
    })

    // ✅ ИСПРАВЛЕНИЕ: Явная проверка с optional chaining
    if (result?.folder?.id && result?.board?.id) {
      notificationStore.success(`Папка "${result.folder.name}" успешно создана`)
      await selectFolder(result.folder.id)
    } else {
      notificationStore.error('Не удалось создать папку или доску')
    }

    closeCreateFolderModal()
  } catch (error) {
    console.error('Ошибка создания папки:', error)
    const message = (error as any)?.data?.message || 'Не удалось создать папку'
    notificationStore.error(message)
  } finally {
    creatingFolder.value = false
  }
}

const fetchFolders = async () => {
  foldersLoading.value = true
  try {
    await foldersStore.fetchFolders()
    // Загружаем все доски для фильтрации по папкам
    await boardsStore.fetchBoards()
  } catch (error) {
    console.error('Ошибка загрузки папок:', error)
  } finally {
    foldersLoading.value = false
  }
}

const fetchObjects = async () => {
  objectsLoading.value = true
  objectsError.value = null
  try {
    const response = await $fetch('/api/objects')
    availableObjects.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    objectsError.value = 'Не удалось загрузить список объектов'
  } finally {
    objectsLoading.value = false
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Lifecycle
onMounted(() => {
  // Загружаем папки при монтировании
  if (foldersStore.allFolders.length === 0) {
    fetchFolders()
  }
  // Загружаем доски если они ещё не загружены
  else if (boardsStore.allBoards.length === 0) {
    boardsStore.fetchBoards()
  }
})
</script>

<style lang="scss" scoped>
ul {
  list-style: none;
  padding: 12px 0;
  margin: 0;

  li {
    margin-bottom: 0;

    &.boards-section {
      .boards-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px 8px;
      }

      .boards-section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #7f8c8d;
        text-transform: uppercase;

        .icon {
          font-size: 16px;
        }
      }

      .boards-section-add-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #27282a;
        border: none;
        color: #00c3f5;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(0, 195, 245, 0.3);
          transform: scale(1.1);
        }
      }

      .boards-loading,
      .boards-empty-state {
        padding: 12px 16px;
        text-align: center;
        color: #888;
        font-size: 13px;

        .loading-icon {
          animation: spin 1s linear infinite;
          margin-bottom: 8px;
        }
      }

      .boards-list {
        list-style: none;
        padding: 0;
        margin: 0;

        .board-item {
          margin: 0;
          cursor: pointer;

          &.active {
            .board-link {
              background: rgba(52, 73, 94, 0.7);
              color: $blue;

              .board-icon {
                color: white;
              }
            }
          }

          .board-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            color: #ccc;
            text-decoration: none;
            background: none;
            border: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 4px;

            &:hover {
              background: rgba(0, 195, 245, 0.15);
              color: #00c3f5;

              .board-icon {
                color: #00c3f5;
              }
            }

            &.router-link-active,
            &:active {
              background: rgba(52, 73, 94, 0.5);
              color: white;

              .board-icon {
                color: white;
              }
            }

            .board-icon {
              color: #7f8c8d;
              font-size: 18px;
              flex-shrink: 0;
            }

            .board-name {
              flex: 1;
              font-size: 13px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .board-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 20px;
              height: 20px;
              padding: 0 6px;
              background: #334155;
              color: #94a3b8;
              font-size: 11px;
              border-radius: 10px;
              font-weight: 500;
            }
          }

          &.folder-item {
            .folder-link {
              .folder-icon {
                color: #00c3f5;
              }

              .folder-name {
                font-weight: 500;
              }

              .folder-count {
                background: rgba(0, 195, 245, 0.2);
                color: #00c3f5;
              }
            }
          }
        }
      }
    }

    &.divider {
      margin: 12px 0;
      pointer-events: none;

      hr {
        border: 0;
        border-top: 1px solid #444;
        margin: 0;
      }
    }

    &.boards-empty {
      padding: 20px;
      text-align: center;
      color: #ccc;

      .icon {
        margin-bottom: 12px;
        color: #666;
      }

      p {
        margin: 0 0 16px 0;
        font-size: 14px;
      }

      .boards-empty-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .create-board-btn {
          display: block;
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s ease;

          &.general {
            background: #34495e;

            &:hover {
              background: #2c3e50;
            }
          }

          &.object {
            background: #1e3a8a;

            &:hover {
              background: #172a66;
            }
          }
        }
      }
    }
  }
}

/* Модалка создания папки */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #333;

  h3 {
    margin: 0;
    color: white;
    font-size: 18px;
  }

  .modal-close {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }
  }
}

.modal-body {
  padding: 20px;
}

.create-folder-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    color: #ccc;
    font-size: 14px;
    font-weight: 500;
  }
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: white;
  font-size: 15px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #00c3f5;
    box-shadow: 0 0 0 2px rgba(0, 195, 245, 0.2);
  }

  &::placeholder {
    color: #666;
  }
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.section-divider {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #333;

  h4 {
    margin: 0 0 8px;
    color: #ccc;
    font-size: 15px;
    font-weight: 600;
  }

  .section-description {
    margin: 0;
    color: #888;
    font-size: 13px;
  }
}

.objects-loading,
.objects-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #888;

  .loading-icon {
    animation: spin 1s linear infinite;
    font-size: 16px;
  }
}

.error-text {
  color: #dc3545;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: #00c3f5;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #00a8d3;
  }
}

.btn-secondary {
  background: #444;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #555;
  }
}

.btn-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .modal {
    max-width: 95%;
    margin: 20px auto;
  }
}

span {
  color: unset;
}
</style>