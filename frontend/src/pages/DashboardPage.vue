<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Files,
  FolderOpen,
  HardDrive,
  Clock,
  ArrowUpRight,
} from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'
import { useAuthStore } from '@/stores/auth'
import StatCard from '@/components/StatCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { formatBytes, formatDate, getFileIcon, getFileColor } from '@/utils'
import type { Component } from 'vue'
import {
  FileText,
  Image,
  Video,
  Music,
  Table,
  Presentation,
  Database,
  File,
} from 'lucide-vue-next'

const router = useRouter()
const statsStore = useStatsStore()
const authStore = useAuthStore()

onMounted(() => {
  statsStore.loadStats()
})

const iconMap: Record<string, Component> = {
  'file-text': FileText,
  image: Image,
  video: Video,
  music: Music,
  table: Table,
  presentation: Presentation,
  database: Database,
  file: File,
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-8">
    <div class="animate-in">
      <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">
        {{ getGreeting() }}, {{ authStore.user?.name?.split(' ')[0] ?? 'there' }}
      </h1>
      <p class="mt-1 text-sm text-surface-fg-muted">
        Here's an overview of your vault
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <template v-if="statsStore.isLoading">
        <LoadingSkeleton variant="stat" :count="4" />
      </template>
      <template v-else-if="statsStore.stats">
        <div class="animate-in animate-stagger-1">
          <StatCard
            label="Total Files"
            :value="String(statsStore.stats.totalFiles)"
            :icon="Files"
            trend="+3 this week"
            :trend-up="true"
          />
        </div>
        <div class="animate-in animate-stagger-2">
          <StatCard
            label="Folders"
            :value="String(statsStore.stats.totalFolders)"
            :icon="FolderOpen"
          />
        </div>
        <div class="animate-in animate-stagger-3">
          <StatCard
            label="Storage Used"
            :value="formatBytes(statsStore.stats.usedBytes)"
            :icon="HardDrive"
          />
        </div>
        <div class="animate-in animate-stagger-4">
          <StatCard
            label="Storage Available"
            :value="formatBytes(statsStore.stats.maxBytes - statsStore.stats.usedBytes)"
            :icon="HardDrive"
          />
        </div>
      </template>
    </div>

    <div class="animate-in animate-stagger-3">
      <div class="rounded-xl border border-surface-border bg-surface-raised">
        <div class="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4 text-surface-fg-subtle" />
            <h2 class="text-sm font-medium text-surface-fg">Recent Files</h2>
          </div>
          <button
            class="flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            @click="router.push('/files')"
          >
            View all
            <ArrowUpRight class="h-3 w-3" />
          </button>
        </div>

        <div v-if="statsStore.isLoading" class="p-5">
          <LoadingSkeleton variant="row" :count="4" />
        </div>

        <div v-else-if="statsStore.stats" class="divide-y divide-surface-border">
          <div
            v-for="file in statsStore.stats.recentFiles"
            :key="file.id"
            class="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-overlay/50 cursor-pointer"
            @click="router.push(`/files/${file.id}`)"
          >
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay">
              <component
                :is="iconMap[getFileIcon(file.mimeType)] ?? File"
                class="h-4 w-4"
                :class="getFileColor(file.mimeType)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-surface-fg">
                {{ file.name }}
              </div>
              <div class="text-xs text-surface-fg-subtle">
                {{ formatBytes(file.size) }}
              </div>
            </div>
            <div class="text-xs text-surface-fg-subtle">
              {{ formatDate(file.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-4 rounded-xl border border-surface-border bg-surface-raised p-5">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-surface-fg">Storage Usage</h3>
          <p class="mt-0.5 text-xs text-surface-fg-subtle">
            {{ statsStore.stats ? formatBytes(statsStore.stats.usedBytes) : '...' }} of
            {{ statsStore.stats ? formatBytes(statsStore.stats.maxBytes) : '...' }}
          </p>
        </div>
        <span class="text-xs font-medium text-accent">
          {{ statsStore.stats ? ((statsStore.stats.usedBytes / statsStore.stats.maxBytes) * 100).toFixed(1) : '0' }}%
        </span>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay">
        <div
          class="h-full rounded-full bg-accent transition-all duration-700"
          :style="{ width: statsStore.stats ? `${(statsStore.stats.usedBytes / statsStore.stats.maxBytes) * 100}%` : '0%' }"
        />
      </div>
    </div>
  </div>
</template>
