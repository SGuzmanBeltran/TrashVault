<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useStatsStore } from '@/stores/stats'
import { Palette, Lock, HardDrive, Eye, EyeOff } from 'lucide-vue-next'
import { ACCENT_PRESETS } from '@/config/accentColors'
import CustomAccentCircle from '@/components/CustomAccentCircle.vue'
import CustomAccentEditor from '@/components/CustomAccentEditor.vue'
import { useNotificationStore } from '@/stores/notification'
import { formatBytes } from '@/utils'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const statsStore = useStatsStore()
const notify = useNotificationStore()

onMounted(() => {
  statsStore.loadStats()
})

const showPasswordForm = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const passwordError = ref('')
const customEditorOpen = ref(false)

function openCustomEditor() {
  customEditorOpen.value = true
}

function closeCustomEditor() {
  customEditorOpen.value = false
}

function selectPreset(name: typeof ACCENT_PRESETS[number]['name']) {
  themeStore.setAccent(name)
  customEditorOpen.value = false
}

async function handleChangePassword() {
  passwordError.value = ''

  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = 'New passwords do not match.'
    return
  }

  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }

  try {
    await authStore.changePassword(oldPassword.value, newPassword.value)
    notify.success('Password updated')
    showPasswordForm.value = false
    oldPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch {
    passwordError.value = 'Failed to change password. Check your current password.'
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div class="animate-in">
      <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">Settings</h1>
      <p class="mt-1 text-sm text-surface-fg-muted">
        Manage your preferences
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
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            v-for="a in ACCENT_PRESETS"
            :key="a.name"
            class="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200"
            :class="themeStore.accent === a.name
              ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
              : 'border-surface-border hover:border-surface-border/80 hover:bg-surface-overlay/50'"
            @click="selectPreset(a.name)"
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

          <button
            type="button"
            class="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200"
            :class="themeStore.accent === 'custom' || customEditorOpen
              ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
              : 'border-surface-border hover:border-surface-border/80 hover:bg-surface-overlay/50'"
            @click="openCustomEditor"
          >
            <CustomAccentCircle
              :selected="themeStore.accent === 'custom'"
              ring-offset-class="ring-offset-surface-raised"
              @open="openCustomEditor"
            />
            <div class="text-center">
              <div class="text-sm font-medium text-surface-fg">Custom</div>
              <div class="text-xs text-surface-fg-subtle">Pick any color</div>
            </div>
          </button>
        </div>

        <div
          v-if="customEditorOpen"
          class="mt-4 rounded-xl border border-surface-border bg-surface p-4"
        >
          <CustomAccentEditor
            :open="customEditorOpen"
            @apply="closeCustomEditor"
            @cancel="closeCustomEditor"
          />
        </div>
      </div>
    </div>

    <div class="animate-in animate-stagger-2 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <Lock class="h-4 w-4 text-accent" />
          Security
        </h2>
      </div>
      <div class="divide-y divide-surface-border">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-surface-fg">Password</div>
              <div class="text-sm text-surface-fg-muted">Update your password and re-encrypt your vault</div>
            </div>
            <button
              class="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              @click="showPasswordForm = !showPasswordForm"
            >
              {{ showPasswordForm ? 'Cancel' : 'Update' }}
            </button>
          </div>

          <form v-if="showPasswordForm" class="mt-4 space-y-3" @submit.prevent="handleChangePassword">
            <div class="relative">
              <input
                v-model="oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                placeholder="Current password"
                required
                class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-fg-subtle transition-colors hover:text-surface-fg"
                @click="showOldPassword = !showOldPassword"
              >
                <EyeOff v-if="showOldPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <div class="relative">
              <input
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="New password (min 8 chars)"
                required
                class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-fg-subtle transition-colors hover:text-surface-fg"
                @click="showNewPassword = !showNewPassword"
              >
                <EyeOff v-if="showNewPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <input
              v-model="confirmNewPassword"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Confirm new password"
              required
              class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
            />
            <p v-if="passwordError" class="text-sm text-danger">{{ passwordError }}</p>
            <button
              type="submit"
              class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
              :disabled="authStore.isLoading"
            >
              Save new password
            </button>
          </form>
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

    <div class="animate-in animate-stagger-3 rounded-2xl border border-surface-border bg-surface-raised">
      <div class="border-b border-surface-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-surface-fg">
          <HardDrive class="h-4 w-4 text-accent" />
          Storage
        </h2>
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-fg-muted">Storage used</span>
          <span class="font-medium text-surface-fg">
            {{ statsStore.stats ? formatBytes(statsStore.stats.usedBytes) : '...' }} of
            {{ statsStore.stats ? formatBytes(statsStore.stats.maxBytes) : '...' }}
          </span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay">
          <div
            class="h-full rounded-full bg-accent transition-all duration-500"
            :style="{ width: statsStore.stats ? `${(statsStore.stats.usedBytes / statsStore.stats.maxBytes) * 100}%` : '0%' }"
          />
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110">
            Upgrade Storage
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
