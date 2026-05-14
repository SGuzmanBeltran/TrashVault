import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/domain/types'
import { useAuthService } from '@/services'
import { useVaultStore } from '@/stores/vault'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const initialCheckDone = ref(false)
  const isAuthenticated = computed(() => user.value !== null)
  const authService = useAuthService()
  let checkSessionPromise: Promise<void> | null = null

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      await authService.login(email, password)
      user.value = await authService.getCurrentUser()
      const vaultStore = useVaultStore()
      await vaultStore.unlock(password)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      const vaultStore = useVaultStore()
      vaultStore.lock()
      await authService.logout()
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function checkSession() {
    if (checkSessionPromise) {
      return checkSessionPromise
    }

    isLoading.value = true
    checkSessionPromise = authService.getCurrentUser().then(async (u) => {
      user.value = u
      if (u) {
        const vaultStore = useVaultStore()
        await vaultStore.tryAutoUnlock()
      }
    }).finally(() => {
      isLoading.value = false
      initialCheckDone.value = true
      checkSessionPromise = null
    })

    return checkSessionPromise
  }

  async function register(email: string, password: string, name: string) {
    isLoading.value = true
    try {
      await authService.register(email, password, name)
      user.value = await authService.getCurrentUser()
      const vaultStore = useVaultStore()
      await vaultStore.initOnRegistration(password)
    } finally {
      isLoading.value = false
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    isLoading.value = true
    try {
      await authService.changePassword(oldPassword, newPassword)
      const vaultStore = useVaultStore()
      await vaultStore.reEncryptDek(oldPassword, newPassword)
    } finally {
      isLoading.value = false
    }
  }

  return { user, isLoading, initialCheckDone, isAuthenticated, login, logout, checkSession, register, changePassword }
})
