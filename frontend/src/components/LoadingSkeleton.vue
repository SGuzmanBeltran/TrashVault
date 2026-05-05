<script setup lang="ts">
defineProps<{
  count?: number
  variant?: 'card' | 'row' | 'stat'
}>()
</script>

<template>
  <template v-if="variant === 'stat'">
    <div
      v-for="i in (count ?? 4)"
      :key="i"
      class="rounded-xl border border-surface-border bg-surface-raised p-5"
    >
      <div class="skeleton h-9 w-9 rounded-lg" />
      <div class="skeleton mt-4 h-7 w-24" />
      <div class="skeleton mt-2 h-4 w-16" />
    </div>
  </template>

  <template v-else-if="variant === 'row'">
    <div
      v-for="i in (count ?? 5)"
      :key="i"
      class="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised p-4"
    >
      <div class="skeleton h-10 w-10 rounded-lg" />
      <div class="flex-1">
        <div class="skeleton h-4 w-40" />
        <div class="skeleton mt-2 h-3 w-24" />
      </div>
    </div>
  </template>

  <template v-else>
    <div
      v-for="i in (count ?? 6)"
      :key="i"
      class="flex flex-col rounded-xl border border-surface-border bg-surface-raised p-4"
    >
      <div class="flex items-start justify-between">
        <div class="skeleton h-11 w-11 rounded-lg" />
      </div>
      <div class="mt-3.5">
        <div class="skeleton h-4 w-3/4" />
        <div class="skeleton mt-2 h-3 w-1/2" />
      </div>
    </div>
  </template>
</template>
