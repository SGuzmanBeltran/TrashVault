<script setup lang="ts">
import { Check, AlertCircle, Info, X } from 'lucide-vue-next'
import type { Notification, NotificationType } from '@/stores/notification'

defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const icons: Record<NotificationType, typeof Check> = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const colors: Record<NotificationType, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent',
}

const bgColors: Record<NotificationType, string> = {
  success: 'bg-success/10',
  error: 'bg-danger/10',
  info: 'bg-accent/10',
}
</script>

<template>
  <div
    class="animate-in group flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised/95 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-sm"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      :class="bgColors[notification.type]"
    >
      <component
        :is="icons[notification.type]"
        class="h-4 w-4"
        :class="colors[notification.type]"
      />
    </div>

    <span class="flex-1 text-[13px] font-medium text-surface-fg">
      {{ notification.message }}
    </span>

    <button
      class="shrink-0 rounded-lg p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
      @click="emit('dismiss', notification.id)"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
