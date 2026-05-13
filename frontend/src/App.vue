<script setup lang="ts">
import { onMounted } from 'vue'
import UploadPanel from '@/components/UploadPanel.vue'
import VaultUnlockModal from '@/components/VaultUnlockModal.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
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
  <VaultUnlockModal v-if="authStore.isAuthenticated && !vaultStore.isUnlocked" />
  <UploadPanel />
  <RouterView />
</template>
