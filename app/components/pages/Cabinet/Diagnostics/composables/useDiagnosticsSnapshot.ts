// app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsSnapshot.ts
/**
 * 🗂 Снимок состояния сторов для карточки «Store snapshot».
 *
 * Куки читает страница (index.vue) — сюда они передаются геттерами, чтобы
 * не дублировать useCookie('auth_token') / useCookie('session_id') в двух местах.
 */
import { ref, computed, watch } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocketStore } from 'stores/socket'
import { useOnlineStore } from 'stores/online'
import { socketService } from 'services/socket.service'

export function useDiagnosticsSnapshot(options: {
  /** Есть ли JWT-кука авторизации */
  hasToken: () => boolean
  /** Текущий session_id из куки (сервер выдаёт его при подключении сокета) */
  sessionId: () => string | null
}) {
  const authStore = useAuthStore()
  const socketStore = useSocketStore()
  const onlineStore = useOnlineStore()

  const snapshotTabs = ['Auth', 'Socket', 'Online', 'Service']
  const activeSnapshotTab = ref('Auth')
  const snapshotData = ref<Record<string, string>>({})

  function refreshSnapshot() {
    snapshotData.value = {
      Auth: JSON.stringify({
        isAuthenticated: authStore.isAuthenticated,
        isChecking: authStore.isChecking,
        userId: authStore.user?.id,
        userRole: authStore.user?.role,
        userName: authStore.user?.name,
        error: authStore.error,
        hasToken: options.hasToken(),
      }, null, 2),
      Socket: JSON.stringify({
        isConnected: socketStore.isConnected,
        isConnecting: socketStore.isConnecting,
        userId: socketStore.userId,
        error: socketStore.error,
        reconnectAttempts: socketStore.reconnectAttempts,
      }, null, 2),
      Online: JSON.stringify({
        count: onlineStore.users.length,
        isLoading: onlineStore.isLoading,
        error: onlineStore.error,
        isSubscribed: onlineStore.isSubscribed,
        users: onlineStore.users.map(u => ({ id: u.userId, name: u.user?.name, status: u.status, path: u.activePath })),
      }, null, 2),
      Service: JSON.stringify({
        connected: socketService.getConnected(),
        socketId: socketService.getSocketId(),
        transport: socketService.getTransport(),
        tabId: socketStore.tabId,
        sessionId: options.sessionId(),
      }, null, 2),
    }
  }

  const activeSnapshot = computed(() => snapshotData.value[activeSnapshotTab.value] || '{}')

  watch(activeSnapshotTab, refreshSnapshot)

  return { snapshotTabs, activeSnapshotTab, activeSnapshot, refreshSnapshot }
}
