<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Shield,
} from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]
</script>

<template>
  <aside class="flex w-60 flex-col border-r border-surface-border bg-surface-raised">
    <div class="flex items-center gap-2.5 px-5 py-5">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
        <Shield class="h-4.5 w-4.5 text-accent" />
      </div>
      <span class="text-[15px] font-semibold tracking-tight text-surface-fg">
        Trashvault
      </span>
    </div>

    <nav class="flex-1 space-y-0.5 px-3">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150"
        :class="
          route.path === item.to || route.path.startsWith(item.to + '/')
            ? 'bg-accent/10 text-accent'
            : 'text-surface-fg-muted hover:bg-surface-overlay hover:text-surface-fg'
        "
      >
        <component
          :is="item.icon"
          class="h-4 w-4 transition-colors"
          :class="
            route.path === item.to || route.path.startsWith(item.to + '/')
              ? 'text-accent'
              : 'text-surface-fg-subtle group-hover:text-surface-fg-muted'
          "
        />
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="border-t border-surface-border px-4 py-4">
      <div class="text-[11px] font-medium uppercase tracking-wider text-surface-fg-subtle">
        Storage
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
        <div class="h-full w-[2%] rounded-full bg-accent transition-all duration-500" />
      </div>
      <div class="mt-1.5 text-xs text-surface-fg-subtle">
        102.7 MB of 5 GB
      </div>
    </div>
  </aside>
</template>
