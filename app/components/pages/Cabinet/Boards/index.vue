<!-- app/components/pages/cabinet/Boards/index.vue -->
<template>
<div class="boards-page">
  <!-- Список папок -->
  <div v-if="!activeFolder" class="folders-view">
    <div class="folders-header">
      <h1 class="page-title">Доски задач</h1>
    </div>
    
    <!-- Загрузка -->
    <div v-if="foldersLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка папок...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="foldersError" class="error-state">
      <Icon name="mdi:alert-circle" size="48" />
      <p>{{ foldersError }}</p>
      <button class="btn btn-secondary" @click="fetchFolders">
        Повторить
      </button>
    </div>
    
    <!-- Пустое состояние -->
    <div v-else-if="folders.length === 0" class="empty-state">
      <Icon name="mdi:folder-open-outline" size="64" />
      <p>У вас пока нет папок</p>
      <button class="btn btn-primary" @click="openCreateFolderModal">
        Создать первую папку
      </button>
    </div>
    
    <!-- Список папок -->
    <div v-else class="folders-grid">
      <!-- Папки по категориям -->
      <div v-for="category in ['objects', 'general'] as const" :key="category" class="category-section">
        <h2 class="category-title">
          <Icon :name="category === 'objects' ? 'mdi:home-outline' : 'mdi:folder-outline'" />
          <span>{{ category === 'objects' ? 'Доски объектов' : 'Общие доски' }}</span>
        </h2>
        
        <div class="folders-list">
          <div
            v-for="folder in getFoldersByCategory(category)"
            :key="folder.id"
            class="folder-card"
            :class="{ active: folder.id === foldersStore.activeFolderId }"
            @click="selectFolder(folder.id)"
          >
            <div class="folder-card-icon">
              <Icon name="mdi:folder" size="32" />
            </div>
            <div class="folder-card-content">
              <h3 class="folder-card-title">{{ folder.name }}</h3>
              <p class="folder-card-description">
                {{ folder.description || 'Без описания' }}
              </p>
              <div class="folder-card-stats">
                <span class="folder-card-badge">{{ getBoardsCount(folder.id) }}</span>
              </div>
            </div>
            <div class="folder-card-footer">
              <span class="folder-card-date">
                {{ formatDate(folder.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Канбан-доска -->
  <Kanban
    v-else
    :folder="activeFolder"
    :board="selectedBoard || {}"
    @back="handleBack"
  />
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardFoldersStore } from 'stores/boards/folders'
import { useBoardsStore } from 'stores/boards'
import Kanban from './Kanban/index.vue'
import type { BoardFolder, Board } from '~/types/boards'

// ============================================
// STORES
// ============================================
const foldersStore = useBoardFoldersStore()
const boardsStore = useBoardsStore()
const router = useRouter()

// ============================================
// STATE
// ============================================
const foldersLoading = computed(() => foldersStore.loading)
const foldersError = computed(() => foldersStore.error)
const folders = computed(() => foldersStore.allFolders)
const activeFolder = computed(() => foldersStore.activeFolder)
const selectedBoard = computed(() => boardsStore.selectedBoard)

// ============================================
// METHODS
// ============================================
const fetchFolders = async () => {
  try {
    await foldersStore.fetchFolders()
  } catch (error) {
    console.error('Ошибка загрузки папок:', error)
  }
}

const getFoldersByCategory = (category: 'objects' | 'general' | string) => {
  return folders.value.filter(f => f.category === category)
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
    
    // Выбираем первую доску (или последнюю посещённую)
    if (boardsInFolder.length > 0) {
        const lastBoard = boardsInFolder[0]
        if (lastBoard) {
            boardsStore.selectBoard(lastBoard.id)
        }
    }
  } catch (error) {
    console.error('Ошибка загрузки досок папки:', error)
  }
}

const handleBack = () => {
  // Возвращаемся к списку папок
  foldersStore.selectFolder(null)
  boardsStore.selectBoard(null)
}

const openCreateFolderModal = () => {
  // TODO: Открыть модалку создания папки
  console.log('Открыть модалку создания папки')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  // Загружаем папки при монтировании
  if (folders.value.length === 0) {
    fetchFolders()
  }
  
  // Если уже выбрана папка, загружаем её доски
  if (activeFolder.value) {
    foldersStore.fetchBoardsInFolder(activeFolder.value.id)
  }
})
</script>

<style scoped lang="scss">
.boards-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folders-view {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: $background-dark;
}

.folders-header {
  margin-bottom: 32px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: $text-light;
  text-align: center;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: $text-light;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #3a3a3a;
  border-top-color: $blue;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  p {
    margin: 20px 0;
    font-size: 16px;
    color: $red;
  }
}

.empty-state {
  p {
    margin: 20px 0;
    font-size: 18px;
    color: $text-gray;
  }
}

.folders-grid {
  display: grid;
  gap: 40px;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: $text-light;
  padding-bottom: 12px;
  border-bottom: 2px solid #374151;
  
  .icon {
    color: $blue;
    font-size: 24px;
  }
}

.folders-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.folder-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: $blue;
  }
  
  &.active {
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.2);
    
    .folder-card-icon {
      color: $blue;
    }
    
    .folder-card-title {
      color: $blue;
    }
  }
}

.folder-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba($blue, 0.1);
  border-radius: 12px;
  color: $blue;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.folder-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: $text-light;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.folder-card-description {
  margin: 0;
  color: $text-gray;
  font-size: 14px;
  line-height: 1.6;
}

.folder-card-stats {
  display: flex;
  gap: 8px;
}

.folder-card-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  background: #374151;
  color: #9ca3af;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 500;
}

.folder-card-footer {
  padding-top: 12px;
  border-top: 1px solid #374151;
}

.folder-card-date {
  color: #6b7280;
  font-size: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: color.adjust($blue, $lightness: -5%);
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #374151;
  }
}

@media (max-width: 768px) {
  .folders-grid {
    gap: 24px;
  }
  
  .folders-list {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 22px;
  }
}
</style>