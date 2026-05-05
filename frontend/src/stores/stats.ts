import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StorageStats } from '@/domain/types'
import { useStatsService } from '@/services'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<StorageStats | null>(null)
  const isLoading = ref(false)
  const statsService = useStatsService()

  async function loadStats() {
    isLoading.value = true
    try {
      stats.value = await statsService.getStats()
    } finally {
      isLoading.value = false
    }
  }

  return { stats, isLoading, loadStats }
})
