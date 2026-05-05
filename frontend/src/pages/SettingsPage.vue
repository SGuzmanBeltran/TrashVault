<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { Palette, Shield, Bell, Lock, HardDrive } from 'lucide-vue-next'
import type { AccentColor } from '@/domain/types'

const themeStore = useThemeStore()
const authStore = useAuthStore()

const accents: { name: AccentColor; label: string; hex: string; description: string }[] = [
  { name: 'cyan', label: 'Cyan', hex: '#22d3ee', description: 'Clean and modern' },
  { name: 'violet', label: 'Violet', hex: '#a78bfa', description: 'Creative and bold' },
  { name: 'orange', label: 'Orange', hex: '#fb923c', description: 'Warm and energetic' },
]
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div class="animate-in">
      <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">Settings</h1>
      <p class="mt-1 text-sm text-surface-fg-muted">
        Manage your account and preferences
      </p>
    </div>

    <div class="animate-in animate-stagger-1 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <Palette class="h-4 w-4 text-accent" />
          Appearance
        </h2>
      </div>
      <div class="p-6">
        <div class="mb-3 text-sm font-medium text-surface-fg">Accent Color</div>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="a in accents"
            :key="a.name"
            class="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200"
            :class="themeStore.accent === a.name
              ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
              : 'border-surface-border hover:border-surface-border/80 hover:bg-surface-overlay/50'"
            @click="themeStore.setAccent(a.name)"
          >
            <div
              class="h-8 w-8 rounded-full transition-transform group-hover:scale-110"
              :style="{ backgroundColor: a.hex }"
            />
            <div class="text-center">
              <div class="text-sm font-medium text-surface-fg">{{ a.label }}</div>
              <div class="text-xs text-surface-fg-subtle">{{ a.description }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-2 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <Shield class="h-4 w-4 text-accent" />
          Account
        </h2>
      </div>
      <div class="divide-y divide-surface-border">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Name</div>
            <div class="text-sm text-surface-fg-muted">{{ authStore.user?.name }}</div>
          </div>
          <button class="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10">
            Edit
          </button>
        </div>
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Email</div>
            <div class="text-sm text-surface-fg-muted">{{ authStore.user?.email }}</div>
          </div>
          <button class="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10">
            Change
          </button>
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-3 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <Lock class="h-4 w-4 text-accent" />
          Security
        </h2>
      </div>
      <div class="divide-y divide-surface-border">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Password</div>
            <div class="text-sm text-surface-fg-muted">Last changed 30 days ago</div>
          </div>
          <button class="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10">
            Update
          </button>
        </div>
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Two-factor authentication</div>
            <div class="text-sm text-surface-fg-muted">Add an extra layer of security</div>
          </div>
          <button class="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
            Enable
          </button>
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-4 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <HardDrive class="h-4 w-4 text-accent" />
          Storage
        </h2>
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-fg-muted">Storage used</span>
          <span class="font-medium text-surface-fg">102.7 MB of 5 GB</span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay">
          <div class="h-full w-[2%] rounded-full bg-accent transition-all duration-500" />
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110">
            Upgrade Storage
          </button>
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-5 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <Bell class="h-4 w-4 text-accent" />
          Notifications
        </h2>
      </div>
      <div class="divide-y divide-surface-border">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Email notifications</div>
            <div class="text-sm text-surface-fg-muted">Receive updates about your account</div>
          </div>
          <button
            class="relative h-6 w-11 rounded-full bg-accent transition-colors"
          >
            <span class="absolute left-[22px] top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all" />
          </button>
        </div>
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <div class="text-sm font-medium text-surface-fg">Storage alerts</div>
            <div class="text-sm text-surface-fg-muted">Get notified when storage is running low</div>
          </div>
          <button
            class="relative h-6 w-11 rounded-full bg-surface-border transition-colors"
          >
            <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
