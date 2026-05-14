<script setup lang="ts">
import { onMounted } from 'vue'
import UploadPanel from '@/components/UploadPanel.vue'
import VaultUnlockModal from '@/components/VaultUnlockModal.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useVaultStore } from '@/stores/vault'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const vaultStore = useVaultStore()

onMounted(() => {
  themeStore.init()
  authStore.checkSession()
})
</script>

<template>
  <NotificationPanel />
  <VaultUnlockModal v-if="authStore.isAuthenticated && !vaultStore.isUnlocked && !vaultStore.isLoading" />
  <UploadPanel />

  <div v-if="!authStore.initialCheckDone" class="flex min-h-screen items-center justify-center bg-surface">
    <div class="w-full max-w-5xl space-y-6 px-6">
      <div class="skeleton h-8 w-48 rounded-lg" />
      <div class="skeleton h-4 w-64 rounded-lg" />
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingSkeleton variant="card" :count="6" />
      </div>
    </div>
  </div>

  <RouterView v-else />
</template>
