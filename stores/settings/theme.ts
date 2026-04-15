// stores/settings/theme.ts
import { defineStore } from 'pinia'

export type ThemeMode = 'dark' | 'light'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'dark' as ThemeMode
  }),

  getters: {
    isDark: (state) => state.mode === 'dark',
    isLight: (state) => state.mode === 'light'
  },

  actions: {
    setTheme(mode: ThemeMode) {
      this.mode = mode

      // Применяем класс к элементу .crm
      if (typeof document !== 'undefined') {
        const crmElement = document.querySelector('.crm')
        if (crmElement) {
          crmElement.classList.remove('crm--dark', 'crm--light')
          crmElement.classList.add(`crm--${mode}`)
        }
      }
    },

    toggleTheme() {
      this.setTheme(this.mode === 'dark' ? 'light' : 'dark')
    },

    initTheme() {
      // Инициализируем тему при загрузке
      if (typeof document !== 'undefined') {
        const crmElement = document.querySelector('.crm')
        if (crmElement) {
          crmElement.classList.add(`crm--${this.mode}`)
        }
      }
    }
  }
})
