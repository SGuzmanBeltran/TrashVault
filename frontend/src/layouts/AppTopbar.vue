<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AccentPicker from '@/components/AccentPicker.vue'

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)

async function handleSignOut() {
  await authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-surface-border bg-surface-raised px-6">
    <div class="relative w-80">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-fg-subtle" />
      <input
        type="text"
        placeholder="Search files and folders..."
        class="w-full rounded-lg border border-surface-border bg-surface py-2 pl-9 pr-4 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
      />
    </div>

    <div class="flex items-center gap-3">
      <AccentPicker />

      <button class="relative rounded-lg p-2 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
        <Bell class="h-4 w-4" />
        <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
      </button>

      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-overlay"
          @click="showUserMenu = !showUserMenu"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
            {{ authStore.user?.name?.charAt(0) ?? 'U' }}
          </div>
          <span class="text-sm text-surface-fg">{{ authStore.user?.name ?? 'User' }}</span>
          <ChevronDown class="h-3.5 w-3.5 text-surface-fg-subtle" />
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            v-if="showUserMenu"
            class="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
          >
            <div class="px-3 py-2.5 border-b border-surface-border">
              <div class="text-sm font-medium text-surface-fg">{{ authStore.user?.name }}</div>
              <div class="text-xs text-surface-fg-subtle">{{ authStore.user?.email }}</div>
            </div>
            <div class="p-1">
              <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
                <User class="h-4 w-4" />
                Profile
              </button>
              <button
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
                @click="handleSignOut"
              >
                <LogOut class="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
