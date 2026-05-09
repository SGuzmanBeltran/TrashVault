<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import UploadPanel from '@/components/UploadPanel.vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const themeStore = useThemeStore()
const authStore = useAuthStore()

onMounted(() => {
  themeStore.init()
  authStore.checkSession()
})
</script>

<template>
  <Toaster position="bottom-right" rich-colors />
  <UploadPanel />
  <RouterView />
</template>
