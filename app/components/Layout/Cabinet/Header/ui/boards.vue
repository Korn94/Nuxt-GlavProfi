<!-- app/components/Layout/Cabinet/Header/ui/boards.vue -->
<template>
  <ul>
    <!-- Общие доски -->
    <li class="boards-section">
      <div class="boards-section-header">
        <div class="boards-section-title">
          <Icon name="mdi:folder-outline" />
          <span>Общие доски</span>
        </div>
        <button 
          class="boards-section-add-btn"
          @click="openCreateBoardModal('general')"
          title="Создать общую доску"
        >
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>
      
      <div v-if="boardsLoading" class="boards-loading">
        <Icon name="mdi:loading" class="loading-icon" />
        <span>Загрузка...</span>
      </div>
      
      <div v-else-if="generalBoards.length === 0" class="boards-empty-state">
        <p>Нет общих досок</p>
      </div>
      
      <ul v-else class="boards-list">
        <li 
          v-for="board in generalBoards" 
          :key="`general-${board.id}`"
          class="board-item"
          :class="{ active: isActiveBoard(board.id) }"
        >
          <button 
            @click="selectBoard(board.id)"
            class="board-link"
          >
            <Icon name="mdi:clipboard-text-outline" class="board-icon" />
            <span class="board-name">{{ board.name }}</span>
          </button>
        </li>
      </ul>
    </li>
    
    <!-- Разделитель -->
    <li v-if="generalBoards.length > 0 && objectBoards.length > 0" class="divider">
      <hr />
    </li>
    
    <!-- Доски объектов -->
    <li class="boards-section">
      <div class="boards-section-header">
        <div class="boards-section-title">
          <Icon name="mdi:home-outline" />
          <span>Доски объектов</span>
        </div>
        <button 
          class="boards-section-add-btn"
          @click="openCreateBoardModal('object')"
          title="Создать доску объекта"
        >
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>
      
      <div v-if="boardsLoading" class="boards-loading">
        <Icon name="mdi:loading" class="loading-icon" />
        <span>Загрузка...</span>
      </div>
      
      <div v-else-if="objectBoards.length === 0" class="boards-empty-state">
        <p>Нет досок объектов</p>
      </div>
      
      <ul v-else class="boards-list">
        <li 
          v-for="board in objectBoards" 
          :key="`object-${board.id}`"
          class="board-item"
          :class="{ active: isActiveBoard(board.id) }"
        >
          <button 
            @click="selectBoard(board.id)"
            class="board-link"
          >
            <Icon name="mdi:clipboard-text-outline" class="board-icon" />
            <span class="board-name">{{ board.name }}</span>
            <span 
              v-if="board.object" 
              class="board-object"
              :title="board.object.address || board.object.name"
            >
              {{ truncateText(board.object.name, 20) }}
            </span>
          </button>
        </li>
      </ul>
    </li>
    
    <!-- Пустое состояние -->
    <li v-if="generalBoards.length === 0 && objectBoards.length === 0 && !boardsLoading" class="boards-empty">
      <Icon name="mdi:clipboard-text-off-outline" size="48" />
      <p>Нет доступных досок</p>
      <div class="boards-empty-actions">
        <button 
          @click="openCreateBoardModal('general')"
          class="create-board-btn general"
        >
          Создать общую доску
        </button>
        <button 
          @click="openCreateBoardModal('object')"
          class="create-board-btn object"
        >
          Создать доску объекта
        </button>
      </div>
    </li>
  </ul>
  
  <!-- Модалка создания доски через Teleport -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCreateBoardModal" class="modal-overlay" @click="closeCreateBoardModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Создать {{ boardTypeLabel }}</h3>
            <button class="modal-close" @click="closeCreateBoardModal" aria-label="Закрыть">
              <Icon name="mdi:close" size="24" />
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleCreateBoard" class="create-board-form">
              <div class="form-group">
                <label for="board-name">Название доски *</label>
                <input
                  id="board-name"
                  v-model="newBoard.name"
                  type="text"
                  class="form-control"
                  placeholder="Введите название доски"
                  required
                  autofocus
                />
              </div>
              
              <div class="form-group">
                <label for="board-description">Описание</label>
                <textarea
                  id="board-description"
                  v-model="newBoard.description"
                  class="form-control"
                  placeholder="Описание доски (необязательно)"
                  rows="2"
                ></textarea>
              </div>
              
              <!-- Выбор типа доски -->
              <div class="form-group">
                <label for="board-type">Тип доски *</label>
                <select
                  id="board-type"
                  v-model="newBoard.type"
                  class="form-control"
                  required
                  @change="handleTypeChange"
                >
                  <option value="general">Общая доска</option>
                  <option value="object">Доска объекта</option>
                </select>
                <div class="type-hint">
                  <span v-if="newBoard.type === 'general'">💡 Общая доска не привязана к конкретному объекту</span>
                  <span v-else>💡 Доска будет привязана к выбранному объекту</span>
                </div>
              </div>
              
              <!-- Выбор объекта для доски объекта -->
              <div v-if="newBoard.type === 'object'" class="form-group">
                <label for="board-object">Выберите объект *</label>
                <select
                  id="board-object"
                  v-model="newBoard.objectId"
                  class="form-control"
                  required
                >
                  <option value="">-- Выберите объект --</option>
                  <option
                    v-for="obj in availableObjects"
                    :key="obj.id"
                    :value="obj.id"
                  >
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
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  @click="closeCreateBoardModal"
                  :disabled="creatingBoard"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="creatingBoard || !canSubmit"
                >
                  <span v-if="creatingBoard">
                    <Icon name="mdi:loading" class="btn-icon spin" />
                    Создание...
                  </span>
                  <span v-else>Создать доску</span>
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
import { useBoardsStore } from '~~/stores/boards'
import { useNotificationStore } from '~~/stores/notifications'

// Emits
const emit = defineEmits<{
  closeSidebar: []
}>()

// Stores
const boardsStore = useBoardsStore()
const notificationStore = useNotificationStore()
const router = useRouter()

// State
const showCreateBoardModal = ref(false)
const creatingBoard = ref(false)
const boardType = ref<'general' | 'object'>('general')
const boardsLoading = ref(false)

// State для формы создания доски
const newBoard = ref({
  name: '',
  description: '',
  type: 'general' as 'general' | 'object',
  objectId: null as number | null
})

// State для объектов
const availableObjects = ref<any[]>([])
const objectsLoading = ref(false)
const objectsError = ref<string | null>(null)

// Computed
const generalBoards = computed(() => {
  return [...boardsStore.generalBoards].sort((a, b) => 
    a.name.localeCompare(b.name, 'ru')
  )
})

const objectBoards = computed(() => {
  return [...boardsStore.objectBoards].sort((a, b) => 
    a.name.localeCompare(b.name, 'ru')
  )
})

const boardTypeLabel = computed(() => {
  return boardType.value === 'general' ? 'доску' : 'доску объекта'
})

const canSubmit = computed(() => {
  const nameValid = newBoard.value.name.trim().length > 0
  const objectValid = newBoard.value.type !== 'object' || !!newBoard.value.objectId
  return nameValid && objectValid
})

// Methods
const isActiveBoard = (boardId: number) => {
  return boardsStore.selectedBoardId === boardId
}

const selectBoard = (id: number) => {
  boardsStore.selectBoard(id)
  emit('closeSidebar')
  router.push('/cabinet/boards')
}

const openCreateBoardModal = (type: 'general' | 'object') => {
  boardType.value = type
  newBoard.value = {
    name: '',
    description: '',
    type: type,
    objectId: null
  }
  
  // Загружаем объекты если нужно
  if (type === 'object' && availableObjects.value.length === 0) {
    fetchObjects()
  }
  
  showCreateBoardModal.value = true
  // Фокус на поле ввода при открытии
  setTimeout(() => {
    const input = document.getElementById('board-name') as HTMLInputElement
    input?.focus()
  }, 100)
}

const closeCreateBoardModal = () => {
  showCreateBoardModal.value = false
  newBoard.value = {
    name: '',
    description: '',
    type: 'general',
    objectId: null
  }
}

const handleTypeChange = () => {
  // Сбрасываем выбор объекта при переключении на общую доску
  if (newBoard.value.type === 'general') {
    newBoard.value.objectId = null
  }
  // Загружаем объекты при переключении на доску объекта
  else if (availableObjects.value.length === 0) {
    fetchObjects()
  }
}

const handleCreateBoard = async () => {
  if (!canSubmit.value) return
  
  creatingBoard.value = true
  try {
    const boardData = {
      name: newBoard.value.name.trim(),
      description: newBoard.value.description.trim() || undefined,
      type: newBoard.value.type,
      ...(newBoard.value.type === 'object' && newBoard.value.objectId && { 
        objectId: Number(newBoard.value.objectId) 
      })
    }
    
    await boardsStore.createBoard(boardData)
    
    // Обновляем список досок
    await fetchBoards()
    
    // Показываем уведомление
    notificationStore.success(`Доска "${boardData.name}" успешно создана`)
    
    // Закрываем модалку
    closeCreateBoardModal()
    
    // Автоматически выбираем созданную доску и переходим к ней
    const lastBoard = boardsStore.allBoards[0]
    if (lastBoard) {
      boardsStore.selectBoard(lastBoard.id)
      router.push('/cabinet/boards')
      emit('closeSidebar')
    }
  } catch (error) {
    console.error('Ошибка создания доски:', error)
    const message = (error as any)?.data?.message || 'Не удалось создать доску'
    notificationStore.error(message)
  } finally {
    creatingBoard.value = false
  }
}

const fetchBoards = async () => {
  boardsLoading.value = true
  try {
    await boardsStore.fetchBoards()
  } catch (error) {
    console.error('Ошибка загрузки досок:', error)
  } finally {
    boardsLoading.value = false
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
  // Загружаем доски при монтировании
  if (boardsStore.allBoards.length === 0) {
    fetchBoards()
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
        background: rgba(0, 195, 245, 0.2);
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
          
          &.active {
            .board-link {
              background: rgba(52, 73, 94, 0.7);
              color: white;
              
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
            
            .board-object {
              font-size: 11px;
              color: #7f8c8d;
              background: rgba(255, 255, 255, 0.05);
              padding: 2px 6px;
              border-radius: 3px;
              white-space: nowrap;
              margin-left: 8px;
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

/* Модалка создания доски - стили вынесены для корректной работы с Teleport */
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

.create-board-form {
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

.type-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
  padding-left: 4px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
</style>