<!-- app/components/pages/cabinet/Boards/Kanban/Header/index.vue -->
<template>
  <div class="kanban">
    <!-- Шапка с названием доски -->
    <div class="kanban-header">
      <div class="kanban-title-container">
        <h1 class="kanban-title">
          {{ activeBoard?.name || 'Выберите доску' }}
        </h1>
        <div v-if="activeBoard?.object" class="kanban-object-name">
          {{ activeBoard.object.name }}
          <span v-if="activeBoard.object.address" class="kanban-object-address">
            — {{ truncateText(activeBoard.object.address, 40) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Навигация по доскам -->
    <div class="boards-navigation-container">
      <div
        ref="boardsNavRef"
        class="boards-nav-container"
        @wheel.prevent="handleWheelScroll"
      >
        <div class="boards-nav-content">
          <div
            v-for="board in boardsInFolder"
            :key="board.id"
            class="board-nav-wrapper"
            :class="{ active: isActiveBoard(board.id) }"
            ref="boardWrappers"
          >
            <!-- ✅ РЕЖИМ ПРОСМОТРА -->
            <template v-if="editingBoardId !== board.id">
              <button
                class="board-nav-item"
                @click="selectBoard(board.id)"
                :title="board.name"
              >
                <span class="board-nav-name">{{ board.name }}</span>
                
                <!-- ✅ КНОПКА МЕНЮ ТОЛЬКО ДЛЯ АКТИВНОЙ ДОСКИ (физически в DOM) -->
                <span
                  v-if="isActiveBoard(board.id)"
                  class="board-menu-trigger"
                  @click.stop="toggleMenu(board.id, $event)"
                  :class="{ open: openMenuId === board.id }"
                >
                  <Icon name="mdi:more-vert" size="16" />
                </span>
              </button>

              <!-- ✅ TELEPORT ДЛЯ МЕНЮ (только для активной доски) -->
              <Teleport to="body">
                <Transition name="menu-fade">
                  <div
                    v-if="openMenuId === board.id && isActiveBoard(board.id)"
                    class="board-menu-dropdown-portal"
                    :style="getMenuPosition(board.id)"
                    @click.stop
                  >
                    <button
                      class="menu-item"
                      @click.stop="startEditing(board)"
                    >
                      <Icon name="mdi:pencil" size="16" />
                      <span>Переименовать</span>
                    </button>
                    <button
                      class="menu-item danger"
                      @click.stop="confirmDelete(board)"
                    >
                      <Icon name="mdi:delete" size="16" />
                      <span>Удалить</span>
                    </button>
                  </div>
                </Transition>
              </Teleport>
            </template>

            <!-- ✅ РЕЖИМ РЕДАКТИРОВАНИЯ (только для активной доски) -->
            <template v-else-if="isActiveBoard(board.id)">
              <input
                ref="editInputRef"
                v-model="editedBoardName"
                type="text"
                class="board-nav-edit-input"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
                @blur="onEditBlur"
                autofocus
              />
              <button
                class="board-action-btn save"
                @click.stop="saveEdit"
                :disabled="!canSaveEdit"
                title="Сохранить"
              >
                <Icon name="mdi:check" size="18" />
              </button>
              <button
                class="board-action-btn cancel"
                @click.stop="cancelEdit"
                title="Отмена"
              >
                <Icon name="mdi:close" size="18" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Кнопки управления -->
      <div class="nav-controls">
        <button
          class="nav-control-btn prev"
          @click="scrollNav(-200)"
          :disabled="navScrollLeft <= 0"
          title="Предыдущие доски"
        >
          <Icon name="mdi:chevron-left" size="20" />
        </button>
        <button
          class="nav-control-btn next"
          @click="scrollNav(200)"
          :disabled="isAtEnd"
          title="Следующие доски"
        >
          <Icon name="mdi:chevron-right" size="20" />
        </button>
        <button
          class="btn-add-board"
          @click="openCreateBoardForm"
          title="Добавить доску в папку"
        >
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>
    </div>

    <!-- Форма создания доски -->
    <div v-if="showCreateBoardForm" class="create-board-inline" ref="createFormRef">
      <input
        v-model="newBoardName"
        type="text"
        class="form-control"
        placeholder="Название доски..."
        @keyup.enter="createBoard"
        @keyup.esc="closeCreateBoardForm"
        autofocus
      />
      <div class="create-board-actions">
        <button class="btn btn-primary" @click="createBoard" :disabled="!canSubmitBoard">
          Создать
        </button>
        <button class="btn btn-secondary" @click="closeCreateBoardForm">
          Отмена
        </button>
      </div>
    </div>

    <!-- ✅ МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Удаление доски</h3>
              <button class="modal-close" @click="cancelDelete">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-warning">
                Вы уверены, что хотите удалить доску
                <strong>"{{ boardToDelete?.name }}"</strong>?
              </p>
              <p class="delete-info">
                Все задачи, подзадачи и комментарии будут удалены без возможности восстановления.
              </p>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="cancelDelete">
                Отмена
              </button>
              <button
                class="btn btn-danger"
                @click="deleteBoard"
                :disabled="deletingBoard"
              >
                <span v-if="deletingBoard">
                  <Icon name="mdi:loading" class="btn-icon spin" />
                  Удаление...
                </span>
                <span v-else>Удалить</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, type CSSProperties } from 'vue'
import { useBoardFoldersStore } from 'stores/boards/folders'
import { useBoardsStore } from 'stores/boards'
import { useNotificationStore } from 'stores/notifications'
import type { Board } from '~/types/boards'

// ============================================
// STORES
// ============================================
const foldersStore = useBoardFoldersStore()
const boardsStore = useBoardsStore()
const notificationStore = useNotificationStore()

// ============================================
// STATE
// ============================================
const boardsNavRef = ref<HTMLElement | null>(null)
const createFormRef = ref<HTMLElement | null>(null)
const editInputRef = ref<HTMLInputElement | null>(null)
const boardWrappers = ref<(HTMLElement | null)[]>([])
const showCreateBoardForm = ref(false)
const newBoardName = ref('')
const creatingBoard = ref(false)
const navScrollLeft = ref(0)
const isAtEnd = ref(false)

// ✅ STATE ДЛЯ РЕДАКТИРОВАНИЯ ДОСКИ
const editingBoardId = ref<number | null>(null)
const editedBoardName = ref('')
const canSaveEdit = computed(() => editedBoardName.value.trim().length > 0)

// ✅ STATE ДЛЯ МЕНЮ (TELEPORT)
const openMenuId = ref<number | null>(null)
const openMenuPosition = ref<{ top: number; right: number } | null>(null)

// ✅ STATE ДЛЯ УДАЛЕНИЯ
const showDeleteConfirm = ref(false)
const boardToDelete = ref<Board | null>(null)
const deletingBoard = ref(false)

// ============================================
// COMPUTED
// ============================================
const activeFolder = computed(() => foldersStore.activeFolder)
const activeBoard = computed(() => boardsStore.selectedBoard)

const boardsInFolder = computed(() => {
  if (!activeFolder.value) return []
  return boardsStore.allBoards
    .filter(b => b.folderId === activeFolder.value?.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

const canSubmitBoard = computed(() => {
  return newBoardName.value.trim().length > 0 && activeFolder.value?.id
})

// ============================================
// METHODS - МЕНЮ С TELEPORT
// ============================================
const toggleMenu = (boardId: number, event: MouseEvent) => {
  if (openMenuId.value === boardId) {
    openMenuId.value = null
    openMenuPosition.value = null
    return
  }
  openMenuId.value = boardId
  
  const trigger = (event.currentTarget as HTMLElement)
  const rect = trigger.getBoundingClientRect()
  openMenuPosition.value = {
    top: rect.bottom + window.scrollY + 8,
    right: window.innerWidth - rect.right
  }
}

const getMenuPosition = (boardId: number): CSSProperties => {
  if (openMenuId.value !== boardId || !openMenuPosition.value) {
    return { display: 'none' }
  }
  return {
    position: 'fixed' as const,  // ✅ as const сужает тип до литерала
    top: `${openMenuPosition.value.top}px`,
    right: `${openMenuPosition.value.right}px`,
    zIndex: 9999,
    display: 'block'
  }
}

const closeAllMenus = () => {
  openMenuId.value = null
  openMenuPosition.value = null
}

// ============================================
// METHODS - РЕДАКТИРОВАНИЕ (ИСПРАВЛЕННЫЕ)
// ============================================
const startEditing = async (board: Board) => {
  editingBoardId.value = board.id
  editedBoardName.value = board.name
  closeAllMenus()
  
  // ✅ Ждём 2 тика для гарантии рендера инпута
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // ✅ Проверка перед фокусом
  if (editInputRef.value && typeof editInputRef.value.focus === 'function') {
    editInputRef.value.focus()
    editInputRef.value.select()
  }
}

const saveEdit = async () => {
  if (!canSaveEdit.value || !editingBoardId.value) return
  
  // ✅ Сохраняем ID доски в локальную переменную ДО отмены редактирования
  const boardIdToFetch = editingBoardId.value
  
  try {
    await boardsStore.updateBoard(boardIdToFetch, {
      name: editedBoardName.value.trim()
    })
    
    notificationStore.success('Доска переименована')
    
    // ✅ Сначала сбрасываем UI-состояние
    cancelEdit()
    
    // ✅ УБРАЛИ fetchBoardById — данные уже обновлены в сторе + придут через сокет
    
  } catch (error) {
    console.error('Ошибка переименования доски:', error)
    const message = (error as any)?.data?.message || 'Не удалось переименовать доску'
    notificationStore.error(message)
  }
}

const cancelEdit = () => {
  editingBoardId.value = null
  editedBoardName.value = ''
}

// ✅ Обработка потери фокуса
const onEditBlur = async (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  if (!relatedTarget || !relatedTarget.classList.contains('board-action-btn')) {
    if (canSaveEdit.value && editedBoardName.value.trim() !== '') {
      await saveEdit()
    } else {
      cancelEdit()
    }
  }
}

// ============================================
// METHODS - УДАЛЕНИЕ
// ============================================
const confirmDelete = (board: Board) => {
  boardToDelete.value = board
  showDeleteConfirm.value = true
  closeAllMenus()
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  boardToDelete.value = null
}

const deleteBoard = async () => {
  if (!boardToDelete.value) return
  
  deletingBoard.value = true
  try {
    await boardsStore.deleteBoard(boardToDelete.value.id)
    
    if (boardsStore.selectedBoardId === boardToDelete.value.id) {
      const remainingBoards = boardsInFolder.value.filter(b => b.id !== boardToDelete.value!.id)
      const firstBoard = remainingBoards[0]  // ✅ Сохраняем в переменную
      if (firstBoard) {  // ✅ Проверяем что существует
        boardsStore.selectBoard(firstBoard.id)
      } else {
        boardsStore.selectBoard(null)
      }
    }
    
    notificationStore.success('Доска удалена')
    cancelDelete()
  } catch (error) {
    console.error('Ошибка удаления доски:', error)
    const message = (error as any)?.data?.message || 'Не удалось удалить доску'
    notificationStore.error(message)
  } finally {
    deletingBoard.value = false
  }
}

// ============================================
// METHODS - НАВИГАЦИЯ
// ============================================
const isActiveBoard = (boardId: number): boolean => {
  return boardsStore.selectedBoardId === boardId
}

const selectBoard = (id: number) => {
  boardsStore.selectBoard(id)
}

const openCreateBoardForm = () => {
  showCreateBoardForm.value = true
  newBoardName.value = ''
  nextTick(() => {
    const input = document.querySelector('.create-board-inline input') as HTMLInputElement
    input?.focus()
    positionCreateForm()
  })
}

const closeCreateBoardForm = () => {
  showCreateBoardForm.value = false
  newBoardName.value = ''
}

const positionCreateForm = () => {
  if (!createFormRef.value || !boardsNavRef.value) return
  const navRect = boardsNavRef.value.getBoundingClientRect()
  const containerRect = boardsNavRef.value.parentElement?.getBoundingClientRect()
  if (containerRect) {
    createFormRef.value.style.right = '0'
    createFormRef.value.style.left = 'auto'
    createFormRef.value.style.top = `${navRect.height + 12}px`
    createFormRef.value.style.width = '320px'
  }
}

const createBoard = async () => {
  if (!canSubmitBoard.value || !activeFolder.value) return
  
  creatingBoard.value = true
  try {
    const boardType = activeFolder.value?.category === 'objects' ? 'object' : 'general'
    let objectId: number | undefined = undefined
    
    if (boardType === 'object') {
      const boardWithObject = boardsInFolder.value.find(b => b.objectId)
      objectId = boardWithObject?.objectId ?? undefined
    }
    
    const board = await boardsStore.createBoard({
      name: newBoardName.value.trim(),
      description: '',
      type: boardType,
      objectId: objectId,
      folderId: activeFolder.value.id
    })
    
    notificationStore.success(`Доска "${board.name}" создана`)
    boardsStore.selectBoard(board.id)
    closeCreateBoardForm()
    await foldersStore.fetchBoardsInFolder(activeFolder.value.id)
  } catch (error) {
    console.error('Ошибка создания доски:', error)
    const message = (error as any)?.data?.message || 'Не удалось создать доску'
    notificationStore.error(message)
  } finally {
    creatingBoard.value = false
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// ============================================
// НАВИГАЦИЯ ПО ДОСКАМ (СКРОЛЛ)
// ============================================
const updateScrollState = () => {
  if (!boardsNavRef.value) return
  const { scrollLeft, scrollWidth, clientWidth } = boardsNavRef.value
  navScrollLeft.value = scrollLeft
  isAtEnd.value = scrollLeft + clientWidth >= scrollWidth - 5
}

const scrollNav = (delta: number) => {
  if (!boardsNavRef.value) return
  boardsNavRef.value.scrollBy({ left: delta, behavior: 'smooth' })
}

const handleWheelScroll = (event: WheelEvent) => {
  if (!boardsNavRef.value) return
  boardsNavRef.value.scrollLeft += event.deltaY
  updateScrollState()
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  if (activeFolder.value?.id) {
    foldersStore.fetchBoardsInFolder(activeFolder.value.id)
  }
  
  const observer = new ResizeObserver(updateScrollState)
  if (boardsNavRef.value) {
    observer.observe(boardsNavRef.value)
  }
  boardsNavRef.value?.addEventListener('scroll', updateScrollState)
  
  // ✅ ЗАКРЫВАЕМ МЕНЮ ПРИ КЛИКЕ ВНЕ КОМПОНЕНТА
  document.addEventListener('click', closeAllMenus)
  
  // ✅ ЗАКРЫВАЕМ МЕНЮ ПРИ СКРОЛЛЕ СТРАНИЦЫ
  window.addEventListener('scroll', () => {
    if (openMenuId.value) {
      closeAllMenus()
    }
  }, true)
  
  return () => {
    observer.disconnect()
    boardsNavRef.value?.removeEventListener('scroll', updateScrollState)
    document.removeEventListener('click', closeAllMenus)
  }
})

onUnmounted(() => {
  if (boardsNavRef.value) {
    boardsNavRef.value.removeEventListener('scroll', updateScrollState)
  }
})

watch(
  () => boardsStore.selectedBoardId,
  () => {
    closeAllMenus()
    cancelEdit()
  }
)
</script>

<style scoped lang="scss">
.kanban {
  margin: 10px;
  margin-bottom: unset;
  border-bottom: 1px solid $text-dark;
}

.kanban-header {
  background: $background-dark;
  border-radius: 12px;
  border: 1px solid #374151;
}

.kanban-title-container {
  text-align: center;
  padding: 12px 0;
}

.kanban-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: $text-light;
  line-height: 1.3;
  word-break: break-word;
}

.kanban-object-name {
  margin-top: 6px;
  font-size: 16px;
  color: $blue;
  font-weight: 500;
  word-break: break-word;
}

.kanban-object-address {
  color: #9ca3af;
  font-size: 14px;
  font-weight: 400;
}

/* Контейнер навигации */
.boards-navigation-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.boards-nav-container {
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.boards-nav-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  min-height: 40px;
}

/* Обёртка для доски */
.board-nav-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  
  &.active {
    .board-nav-item {
      background: rgba($blue, 0.1);
      color: $blue;
      border-color: $blue;
      
      .board-nav-name {
        font-weight: 600;
      }
    }
  }
}

/* Кнопка доски */
.board-nav-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 16px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  
  &:hover {
    background: rgba($blue, 0.15);
    color: $blue;
    border-color: rgba($blue, 0.3);
  }
}

.board-nav-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ Кнопка меню — всегда видима для активной доски */
.board-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.open {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* Меню через Teleport */
.board-menu-dropdown-portal {
  position: fixed;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $text-light;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.danger {
    color: $red;
    
    &:hover {
      background: rgba($red, 0.15);
    }
  }
}

/* Поле редактирования */
.board-nav-edit-input {
  background: #1f2937;
  border: 1px solid $blue;
  border-radius: 6px;
  padding: 6px 10px;
  color: $text-light;
  font-size: 14px;
  font-weight: 500;
  width: 150px;
  outline: none;
  
  &:focus {
    box-shadow: 0 0 0 2px rgba($blue, 0.2);
  }
}

/* Кнопки действий */
.board-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &.save {
    background: rgba($green, 0.2);
    color: $green;
    
    &:hover:not(:disabled) {
      background: rgba($green, 0.3);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  &.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #9ca3af;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: $text-light;
    }
  }
}

/* Контролы навигации справа */
.nav-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.nav-control-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba($blue, 0.15);
    color: $blue;
    border-color: rgba($blue, 0.3);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  &.prev {
    transform: rotate(180deg);
  }
}

/* Кнопка добавления доски */
.btn-add-board {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba($blue, 0.2);
  border: 1px solid rgba($blue, 0.3);
  color: $blue;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba($blue, 0.3);
    transform: scale(1.05);
  }
}

/* Инлайн форма создания доски */
.create-board-inline {
  position: absolute;
  right: 0;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 10;
  animation: slideDown 0.2s ease;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }
  
  &::placeholder {
    color: #6b7280;
  }
}

.create-board-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: $green;
  }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #374151;
  }
}

.btn-danger {
  background: rgba($red, 0.2);
  color: $red;
  border: 1px solid rgba($red, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba($red, 0.3);
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
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Анимация меню */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Модалка удаления */
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
  z-index: 10000;
  padding: 20px;
}

.modal {
  background: #111827;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: $text-light;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: $text-light;
      background: #374151;
    }
  }
}

.modal-body {
  padding: 24px;
}

.delete-warning {
  margin: 0 0 16px 0;
  color: $text-light;
  font-size: 15px;
  line-height: 1.5;
  
  strong {
    color: $blue;
  }
}

.delete-info {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #374151;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .kanban-header {
    padding: 16px;
  }
  
  .kanban-title {
    font-size: 22px;
  }
  
  .kanban-object-name {
    font-size: 14px;
  }
  
  .boards-navigation-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .nav-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .board-nav-item {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .btn-add-board {
    width: 32px;
    height: 32px;
  }
  
  .create-board-inline {
    width: 100%;
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
}

@media (max-width: 480px) {
  .kanban-title {
    font-size: 20px;
  }
  
  .board-nav-name {
    max-width: 120px;
    font-size: 13px;
  }
  
  .board-nav-item {
    padding: 8px 12px;
  }
  
  .nav-control-btn,
  .btn-add-board {
    width: 32px;
    height: 32px;
  }
}

span {
  color: unset;
}
</style>