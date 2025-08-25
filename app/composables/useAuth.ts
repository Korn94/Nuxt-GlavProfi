// composables\useAuth.ts
// Используем прямой импорт
import { useCookie } from 'nuxt/app'

export function useAuth() {
  const token = useCookie('token')

  async function login(login: string, password: string) {
    const res = await $fetch<{ token: string} >('/api/auth/login', {
      method: 'POST',
      body: { login, password },
    })
    token.value = res.token
  }

  function logout() {
    token.value = null
  }

  return { token, login, logout }
}
