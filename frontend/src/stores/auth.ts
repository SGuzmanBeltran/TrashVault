import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TwoFactorSetupResult, User } from '@/domain/types'
import { useAuthService } from '@/services'
import { useVaultStore } from '@/stores/vault'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const initialCheckDone = ref(false)
  const pendingLoginPassword = ref<string | null>(null)
  const isAuthenticated = computed(() => user.value !== null)
  const pendingTwoFactor = computed(() => pendingLoginPassword.value !== null)
  const authService = useAuthService()
  let checkSessionPromise: Promise<void> | null = null

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      const result = await authService.login(email, password)
      if (result.needsTwoFactor) {
        pendingLoginPassword.value = password
        return
      }

      user.value = await authService.getCurrentUser()
      const vaultStore = useVaultStore()
      await vaultStore.unlock(password)
    } finally {
      isLoading.value = false
    }
  }

  async function completeTwoFactorLogin(
    code: string,
    options?: { backupCode?: boolean; trustDevice?: boolean },
  ) {
    isLoading.value = true
    try {
      await authService.verifyTwoFactor(code, options)
      user.value = await authService.getCurrentUser()

      const password = pendingLoginPassword.value
      pendingLoginPassword.value = null

      if (password) {
        const vaultStore = useVaultStore()
        await vaultStore.unlock(password)
      }
    } finally {
      isLoading.value = false
    }
  }

  function cancelPendingTwoFactor() {
    pendingLoginPassword.value = null
  }

  async function enableTwoFactor(password: string): Promise<TwoFactorSetupResult> {
    isLoading.value = true
    try {
      return await authService.enableTwoFactor(password)
    } finally {
      isLoading.value = false
    }
  }

  async function verifyTwoFactorEnrollment(code: string) {
    isLoading.value = true
    try {
      await authService.verifyTwoFactorEnrollment(code)
      user.value = await authService.getCurrentUser()
    } finally {
      isLoading.value = false
    }
  }

  async function disableTwoFactor(password: string) {
    isLoading.value = true
    try {
      await authService.disableTwoFactor(password)
      user.value = await authService.getCurrentUser()
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
      pendingLoginPassword.value = null
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

  return {
    user,
    isLoading,
    initialCheckDone,
    pendingTwoFactor,
    isAuthenticated,
    login,
    completeTwoFactorLogin,
    cancelPendingTwoFactor,
    enableTwoFactor,
    verifyTwoFactorEnrollment,
    disableTwoFactor,
    logout,
    checkSession,
    register,
    changePassword,
  }
})
