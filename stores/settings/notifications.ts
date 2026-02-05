// // stores/settings/notifications.ts
// import { defineStore } from 'pinia'

// export interface NotificationSettings {
//   // Уведомления о статусах пользователей
//   userStatus: {
//     enabled: boolean
//     showOnline: boolean
//     showOffline: boolean
//     showAFK: boolean
//     soundEnabled: boolean
//     duration: number
//     position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
//   }
//   // Общие настройки
//   general: {
//     maxVisible: number
//     autoHide: boolean
//     hideDuration: number
//   }
// }

// const DEFAULT_SETTINGS: NotificationSettings = {
//   userStatus: {
//     enabled: true,
//     showOnline: true,
//     showOffline: true,
//     showAFK: true,
//     soundEnabled: false,
//     duration: 3000,
//     position: 'top-right'
//   },
//   general: {
//     maxVisible: 5,
//     autoHide: true,
//     hideDuration: 6000
//   }
// }

// export const useNotificationSettingsStore = defineStore('notificationSettings', {
//   state: (): NotificationSettings => ({ ...DEFAULT_SETTINGS }),
  
//   getters: {
//     getUserStatusSettings: (state) => state.userStatus,
//     isUserStatusEnabled: (state) => state.userStatus.enabled,
//     shouldShowStatus: (state) => {
//       return (status: 'online' | 'offline' | 'afk'): boolean => {
//         if (!state.userStatus.enabled) return false
//         return state.userStatus[`show${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof state.userStatus]
//       }
//     },
//     getNotificationPosition: (state) => state.userStatus.position,
//     getNotificationDuration: (state) => state.userStatus.duration
//   },
  
//   actions: {
//     toggleUserStatus(enabled: boolean) {
//       this.userStatus.enabled = enabled
//     },
    
//     toggleStatusType(status: 'online' | 'offline' | 'afk', enabled: boolean) {
//       const key = `show${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof this.userStatus
//       this.userStatus[key] = enabled
//     },
    
//     setDuration(duration: number) {
//       this.userStatus.duration = duration
//     },
    
//     setPosition(position: NotificationSettings['userStatus']['position']) {
//       this.userStatus.position = position
//     },
    
//     toggleSound(enabled: boolean) {
//       this.userStatus.soundEnabled = enabled
//     },
    
//     resetToDefaults() {
//       Object.assign(this.$state, { ...DEFAULT_SETTINGS })
//     }
//   },
  
//   persist: true
// })
