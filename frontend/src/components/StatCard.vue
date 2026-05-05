<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  icon: Component
  trend?: string
  trendUp?: boolean
}>()
</script>

<template>
  <div class="rounded-xl border border-surface-border bg-surface-raised p-5">
    <div class="flex items-center justify-between">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
        <component :is="icon" class="h-4.5 w-4.5 text-accent" />
      </div>
      <span
        v-if="trend"
        class="rounded-full px-2 py-0.5 text-xs font-medium"
        :class="trendUp ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'"
      >
        {{ trend }}
      </span>
    </div>
    <div class="mt-4 text-2xl font-semibold tracking-tight text-surface-fg">
      {{ value }}
    </div>
    <div class="mt-1 text-sm text-surface-fg-muted">
      {{ label }}
    </div>
  </div>
</template>
