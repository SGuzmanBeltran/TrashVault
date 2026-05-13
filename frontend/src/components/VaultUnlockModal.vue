<script setup lang="ts">
import { ref } from 'vue'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useVaultStore } from '@/stores/vault'

const vaultStore = useVaultStore()
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const isLoading = ref(false)

async function handleUnlock() {
  error.value = ''
  isLoading.value = true
  try {
    await vaultStore.unlock(password.value)
  } catch {
    error.value = 'Failed to unlock vault. Wrong password?'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="animate-in w-full max-w-sm">
      <div class="rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-2xl">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
            <Shield class="h-6 w-6 text-accent" />
          </div>
          <h2 class="text-xl font-semibold tracking-tight text-surface-fg">
            Unlock vault
          </h2>
          <p class="mt-1.5 text-sm text-surface-fg-muted">
            Enter your password to decrypt your files
          </p>
        </div>

        <form @submit.prevent="handleUnlock">
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autofocus
              class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
            />
            <button
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-fg-subtle transition-colors hover:text-surface-fg"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>

          <p v-if="error" class="mt-3 text-sm text-danger">
            {{ error }}
          </p>

          <button
            type="submit"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            :disabled="isLoading || !password"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <template v-else>
              Unlock
            </template>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
