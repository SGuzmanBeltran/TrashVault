<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('demo@trashvault.dev')
const password = ref('password123')
const showPassword = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    if (authStore.pendingTwoFactor) {
      router.push({ name: 'two-factor' })
      return
    }
    router.push('/dashboard')
  } catch {
    error.value = 'Invalid credentials. Please try again.'
  }
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
          Welcome back
        </h1>
        <p class="mt-1.5 text-sm text-surface-fg-muted">
          Sign in to your Trashvault
        </p>
      </div>

      <form
        class="rounded-2xl border border-surface-border bg-surface-raised p-6"
        @submit.prevent="handleLogin"
      >
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-surface-fg" for="email">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-surface-fg" for="password">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
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
          </div>
        </div>

        <p v-if="error" class="mt-3 text-sm text-danger">
          {{ error }}
        </p>

        <button
          type="submit"
          class="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
          :disabled="authStore.isLoading"
        >
          <template v-if="authStore.isLoading">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-accent-fg/30 border-t-accent-fg" />
          </template>
          <template v-else>
            Sign in
            <ArrowRight class="h-4 w-4" />
          </template>
        </button>

        <p class="mt-4 text-center text-xs text-surface-fg-subtle">
          Demo credentials are pre-filled
        </p>

        <p class="mt-2 text-center text-xs text-surface-fg-subtle">
          Don't have an account?
          <router-link to="/register" class="text-accent hover:underline">Create one</router-link>
        </p>
      </form>
    </div>
  </div>
</template>
