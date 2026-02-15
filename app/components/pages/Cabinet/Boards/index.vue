<!-- app/components/pages/cabinet/Boards/index.vue -->
 <template>
  <div class="boards-page">
    <div class="boards-header">
      <h1 class="boards-title">Доска задач</h1>
      
      <div class="boards-header-actions">
        <button class="btn btn-primary" @click="showCreateBoardModal = true">
          <span class="icon">+</span>
          Создать доску
        </button>
      </div>
    </div>

    <div class="boards-content">
      <!-- Список досок -->
      <div v-if="!selectedBoard" class="boards-list">
        <div v-if="loading" class="boards-loading">
          <div class="spinner"></div>
          <p>Загрузка досок...</p>
        </div>

        <div v-else-if="error" class="boards-error">
          <p>{{ error }}</p>
          <button class="btn btn-secondary" @click="fetchAllBoards">
            Повторить
          </button>
        </div>

        <div v-else-if="boards.length === 0" class="boards-empty">
          <div class="empty-icon">📋</div>
          <p>У вас пока нет досок задач</p>
          <button class="btn btn-primary" @click="showCreateBoardModal = true">
            Создать первую доску
          </button>
        </div>

        <div v-else class="boards-grid">
          <!-- Доски с объектами -->
          <div v-if="objectBoards.length > 0" class="boards-section">
            <h2 class="section-title">Доски объектов</h2>
            <div class="boards-cards">
              <div
                v-for="board in objectBoards"
                :key="board.id"
                class="board-card"
                @click="selectBoard(board.id)"
              >
                <div class="board-card-header">
                  <span class="board-card-icon">🏗️</span>
                  <h3 class="board-card-title">{{ board.name }}</h3>
                </div>
                <div class="board-card-body">
                  <p class="board-card-description">
                    {{ board.description || 'Без описания' }}
                  </p>
                  <div class="board-card-meta">
                    <span class="board-card-type">Привязана к объекту</span>
                    <span v-if="board.object" class="board-card-object">
                      📍 {{ board.object.name }}
                    </span>
                  </div>
                </div>
                <div class="board-card-footer">
                  <span class="board-card-date">
                    Создана: {{ formatDate(board.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Общие доски -->
          <div v-if="generalBoards.length > 0" class="boards-section">
            <h2 class="section-title">Общие доски</h2>
            <div class="boards-cards">
              <div
                v-for="board in generalBoards"
                :key="board.id"
                class="board-card"
                @click="selectBoard(board.id)"
              >
                <div class="board-card-header">
                  <span class="board-card-icon">📋</span>
                  <h3 class="board-card-title">{{ board.name }}</h3>
                </div>
                <div class="board-card-body">
                  <p class="board-card-description">
                    {{ board.description || 'Без описания' }}
                  </p>
                  <div class="board-card-meta">
                    <span class="board-card-type">Общая доска</span>
                  </div>
                </div>
                <div class="board-card-footer">
                  <span class="board-card-date">
                    Создана: {{ formatDate(board.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Доска задач (канбан) -->
      <BoardKanban
        v-else
        :board="selectedBoard"
        @back="handleBack"
      />
    </div>

    <!-- Модалка создания доски -->
    <div v-if="showCreateBoardModal" class="modal-overlay" @click="closeCreateBoardModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Создать доску</h2>
          <button class="modal-close" @click="closeCreateBoardModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateBoard">
            <div class="form-group">
              <label for="board-name">Название доски *</label>
              <input
                id="board-name"
                v-model="newBoard.name"
                type="text"
                class="form-control"
                placeholder="Введите название доски"
                required
              />
            </div>

            <div class="form-group">
              <label for="board-description">Описание</label>
              <textarea
                id="board-description"
                v-model="newBoard.description"
                class="form-control"
                placeholder="Описание доски (необязательно)"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="board-type">Тип доски *</label>
              <select
                id="board-type"
                v-model="newBoard.type"
                class="form-control"
                required
              >
                <option value="general">Общая доска</option>
                <option value="object">Привязана к объекту</option>
              </select>
            </div>

            <div v-if="newBoard.type === 'object'" class="form-group">
              <label for="board-object">Выберите объект *</label>
              <select
                id="board-object"
                v-model="newBoard.objectId"
                class="form-control"
                required
              >
                <option value="">Выберите объект</option>
                <option
                  v-for="obj in availableObjects"
                  :key="obj.id"
                  :value="obj.id"
                >
                  {{ obj.name }} - {{ obj.address || 'Без адреса' }}
                </option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="closeCreateBoardModal">
                Отмена
              </button>
              <button type="submit" class="btn btn-primary" :disabled="creatingBoard">
                {{ creatingBoard ? 'Создание...' : 'Создать' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BoardKanban from './ui/BoardKanban.vue'
import { useBoardsStore } from '~~/stores/boards'

// Типы
interface BoardCreateData {
  name: string
  description: string
  type: 'general' | 'object'
  objectId?: number
}

// Получаем стор напрямую
const boardsStore = useBoardsStore()

// Используем свойства стора
const boards = computed(() => boardsStore.allBoards)
const selectedBoardId = computed(() => boardsStore.selectedBoardId)
const selectedBoard = computed(() => boardsStore.selectedBoard)
const objectBoards = computed(() => boardsStore.objectBoards)
const generalBoards = computed(() => boardsStore.generalBoards)
const loading = computed(() => boardsStore.loading)
const error = computed(() => boardsStore.error)

// Methods
const fetchAllBoards = async () => {
  await boardsStore.fetchBoards()
}

const createBoard = async (data: BoardCreateData) => {
  await boardsStore.createBoard(data)
}

const selectBoard = (id: number | null) => {
  boardsStore.selectBoard(id)
}

// State
const showCreateBoardModal = ref(false)
const creatingBoard = ref(false)
const availableObjects = ref<{ id: number; name: string; address?: string }[]>([])

const newBoard = ref({
  name: '',
  description: '',
  type: 'general' as 'general' | 'object',
  objectId: undefined as number | undefined
})

// Lifecycle
onMounted(async () => {
  await fetchAllBoards()
  
  // Загружаем список объектов для выбора
  try {
    const response = await fetch('/api/objects')
    const data = await response.json()
    availableObjects.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch objects:', err)
  }
})

// Methods
const handleCreateBoard = async () => {
  creatingBoard.value = true
  
  try {
    await createBoard({
      name: newBoard.value.name,
      description: newBoard.value.description,
      type: newBoard.value.type,
      objectId: newBoard.value.objectId
    })
    
    await fetchAllBoards()
    closeCreateBoardModal()
  } catch (err) {
    console.error('Failed to create board:', err)
  } finally {
    creatingBoard.value = false
  }
}

const handleBack = () => {
  selectBoard(null)
}

const closeCreateBoardModal = () => {
  showCreateBoardModal.value = false
  newBoard.value = {
    name: '',
    description: '',
    type: 'general',
    objectId: undefined
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
.boards-page {
  padding: 20px;
  height: 100%;
}

.boards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #3a3a3a;
}

.boards-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
}

.boards-header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}

.boards-content {
  min-height: calc(100vh - 150px);
}

.boards-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.boards-loading,
.boards-error,
.boards-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a3a;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.boards-error p,
.boards-empty p {
  margin: 15px 0;
  color: #9ca3af;
  font-size: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.boards-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  padding-left: 10px;
  border-left: 4px solid #3b82f6;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.boards-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.board-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: #3b82f6;
  }
}

.board-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.board-card-icon {
  font-size: 24px;
}

.board-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.board-card-body {
  margin-bottom: 15px;
}

.board-card-description {
  margin: 0 0 10px 0;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.5;
}

.board-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.board-card-type {
  display: inline-block;
  padding: 4px 8px;
  background: #374151;
  color: #9ca3af;
  font-size: 12px;
  border-radius: 4px;
}

.board-card-object {
  display: inline-block;
  padding: 4px 8px;
  background: #1e3a8a;
  color: #93c5fd;
  font-size: 12px;
  border-radius: 4px;
}

.board-card-footer {
  padding-top: 15px;
  border-top: 1px solid #374151;
}

.board-card-date {
  color: #6b7280;
  font-size: 12px;
}

/* Modal */
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
  background: #111827;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  
  &:hover {
    color: #fff;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.form-control::placeholder {
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #374151;
}
</style>