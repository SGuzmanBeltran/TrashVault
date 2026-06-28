<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, ArrowRight, KeyRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const code = ref('')
const useBackupCode = ref(false)
const trustDevice = ref(true)
const error = ref('')

async function handleVerify() {
  error.value = ''
  try {
    await authStore.completeTwoFactorLogin(code.value.trim(), {
      backupCode: useBackupCode.value,
      trustDevice: trustDevice.value,
    })
    router.push('/dashboard')
  } catch {
    error.value = useBackupCode.value
      ? 'Invalid backup code. Please try again.'
      : 'Invalid code. Please try again.'
  }
}

function handleCancel() {
  authStore.cancelPendingTwoFactor()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface p-4">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      <div class="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/3 blur-3xl" />
    </div>

    <div class="animate-in relative w-full max-w-sm">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
          <Shield class="h-6 w-6 text-accent" />
        </div>
        <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">
          Two-factor authentication
        </h1>
        <p class="mt-1.5 text-sm text-surface-fg-muted">
          Enter the code from your authenticator app
        </p>
      </div>

      <form
        class="rounded-2xl border border-surface-border bg-surface-raised p-6"
        @submit.prevent="handleVerify"
      >
        <div>
          <label class="mb-1.5 block text-sm font-medium text-surface-fg" for="code">
            {{ useBackupCode ? 'Backup code' : 'Authentication code' }}
          </label>
          <input
            id="code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            :placeholder="useBackupCode ? 'Enter backup code' : '000000'"
            autofocus
            class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
          />
        </div>

        <label class="mt-4 flex items-center gap-2 text-sm text-surface-fg-muted">
          <input
            v-model="trustDevice"
            type="checkbox"
            class="rounded border-surface-border text-accent focus:ring-accent/20"
          />
          Trust this device for 30 days
        </label>

        <button
          type="button"
          class="mt-4 flex items-center gap-1.5 text-xs text-surface-fg-muted transition-colors hover:text-surface-fg"
          @click="useBackupCode = !useBackupCode"
        >
          <KeyRound class="h-3.5 w-3.5" />
          {{ useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead' }}
        </button>

        <p v-if="error" class="mt-3 text-sm text-danger">
          {{ error }}
        </p>

        <button
          type="submit"
          class="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
          :disabled="authStore.isLoading || !code.trim()"
        >
          <template v-if="authStore.isLoading">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-accent-fg/30 border-t-accent-fg" />
          </template>
          <template v-else>
            Verify
            <ArrowRight class="h-4 w-4" />
          </template>
        </button>

        <button
          type="button"
          class="mt-3 w-full text-center text-xs text-surface-fg-subtle transition-colors hover:text-surface-fg"
          @click="handleCancel"
        >
          Back to sign in
        </button>
      </form>
    </div>
  </div>
</template>
