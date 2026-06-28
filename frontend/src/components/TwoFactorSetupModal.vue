<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { Shield, Eye, EyeOff, Copy, Check, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

const props = defineProps<{
  open: boolean
  mode: 'enable' | 'disable'
}>()

const emit = defineEmits<{
  close: []
  enabled: []
  disabled: []
}>()

const authStore = useAuthStore()
const notify = useNotificationStore()

const password = ref('')
const showPassword = ref(false)
const error = ref('')
const step = ref<'password' | 'setup' | 'verify'>('password')
const totpURI = ref('')
const qrDataUrl = ref('')
const backupCodes = ref<string[]>([])
const verificationCode = ref('')
const copiedCodes = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) reset()
  },
)

function reset() {
  password.value = ''
  showPassword.value = false
  error.value = ''
  step.value = 'password'
  totpURI.value = ''
  qrDataUrl.value = ''
  backupCodes.value = []
  verificationCode.value = ''
  copiedCodes.value = false
}

async function handlePasswordSubmit() {
  error.value = ''
  try {
    if (props.mode === 'disable') {
      await authStore.disableTwoFactor(password.value)
      notify.success('Two-factor authentication disabled.')
      emit('disabled')
      emit('close')
      return
    }

    const result = await authStore.enableTwoFactor(password.value)
    totpURI.value = result.totpURI
    backupCodes.value = result.backupCodes
    qrDataUrl.value = await QRCode.toDataURL(result.totpURI, { width: 200, margin: 1 })
    step.value = 'setup'
  } catch {
    error.value = 'Incorrect password. Please try again.'
  }
}

function goToVerify() {
  step.value = 'verify'
}

async function handleVerify() {
  error.value = ''
  try {
    await authStore.verifyTwoFactorEnrollment(verificationCode.value.trim())
    notify.success('Two-factor authentication enabled.')
    emit('enabled')
    emit('close')
  } catch {
    error.value = 'Invalid code. Check your authenticator app and try again.'
  }
}

async function copyBackupCodes() {
  await navigator.clipboard.writeText(backupCodes.value.join('\n'))
  copiedCodes.value = true
  setTimeout(() => {
    copiedCodes.value = false
  }, 2000)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="emit('close')"
  >
    <div class="animate-in w-full max-w-md">
      <div class="rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <Shield class="h-5 w-5 text-accent" />
            </div>
            <h2 class="text-lg font-semibold text-surface-fg">
              {{
                mode === 'disable'
                  ? 'Disable 2FA'
                  : step === 'verify'
                    ? 'Verify setup'
                    : 'Enable 2FA'
              }}
            </h2>
            <p class="mt-1 text-sm text-surface-fg-muted">
              <template v-if="mode === 'disable'">
                Enter your password to turn off two-factor authentication.
              </template>
              <template v-else-if="step === 'password'">
                Confirm your password to start setup.
              </template>
              <template v-else-if="step === 'setup'">
                Scan the QR code with your authenticator app, then save your backup codes.
              </template>
              <template v-else>
                Enter the 6-digit code from your authenticator app to finish setup.
              </template>
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-surface-fg-subtle transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <form
          v-if="step === 'password' || mode === 'disable'"
          @submit.prevent="handlePasswordSubmit"
        >
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autofocus
              required
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

          <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

          <button
            type="submit"
            class="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            :disabled="authStore.isLoading || !password"
          >
            {{ mode === 'disable' ? 'Disable 2FA' : 'Continue' }}
          </button>
        </form>

        <div v-else-if="step === 'setup'" class="space-y-4">
          <div class="flex justify-center rounded-xl border border-surface-border bg-surface p-4">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="TOTP QR code"
              class="h-[200px] w-[200px]"
            />
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium uppercase tracking-wide text-surface-fg-muted">
                Backup codes
              </span>
              <button
                type="button"
                class="flex items-center gap-1 text-xs text-accent hover:underline"
                @click="copyBackupCodes"
              >
                <Check v-if="copiedCodes" class="h-3 w-3" />
                <Copy v-else class="h-3 w-3" />
                {{ copiedCodes ? 'Copied' : 'Copy all' }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2 rounded-lg border border-surface-border bg-surface p-3">
              <code
                v-for="backupCode in backupCodes"
                :key="backupCode"
                class="text-xs text-surface-fg"
              >
                {{ backupCode }}
              </code>
            </div>
            <p class="mt-2 text-xs text-surface-fg-subtle">
              Store these codes somewhere safe. Each can be used once if you lose access to your authenticator.
            </p>
          </div>

          <button
            type="button"
            class="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110"
            @click="goToVerify"
          >
            I've saved my backup codes
          </button>
        </div>

        <form v-else @submit.prevent="handleVerify">
          <input
            v-model="verificationCode"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="000000"
            autofocus
            required
            class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
          />

          <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

          <button
            type="submit"
            class="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            :disabled="authStore.isLoading || !verificationCode.trim()"
          >
            Verify and enable
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
