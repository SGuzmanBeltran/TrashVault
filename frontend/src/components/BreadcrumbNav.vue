<script setup lang="ts">
import type { Breadcrumb } from '@/domain/types'
import BreadcrumbDropItem from '@/components/BreadcrumbDropItem.vue'

defineProps<{
  breadcrumbs: Breadcrumb[]
}>()

const emit = defineEmits<{
  navigate: [id: string | null, name: string]
}>()
</script>

<template>
  <nav
    aria-label="Folder path"
    class="animate-in animate-stagger-1 flex flex-wrap items-center text-sm"
  >
    <BreadcrumbDropItem
      v-for="(crumb, index) in breadcrumbs"
      :key="crumb.id ?? 'root'"
      :folder-id="crumb.id"
      :name="crumb.name"
      :show-separator="index < breadcrumbs.length - 1"
      :is-current="index === breadcrumbs.length - 1"
      @navigate="emit('navigate', crumb.id, crumb.name)"
    />
  </nav>
</template>
