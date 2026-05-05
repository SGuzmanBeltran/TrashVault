import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/domain/types'
import { useAuthService } from '@/services'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isAuthenticated = computed(() => user.value !== null)
  const authService = useAuthService()

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      await authService.login(email, password)
      user.value = await authService.getCurrentUser()
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      await authService.logout()
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function checkSession() {
    isLoading.value = true
    try {
      user.value = await authService.getCurrentUser()
    } finally {
      isLoading.value = false
    }
  }

  return { user, isLoading, isAuthenticated, login, logout, checkSession }
})
