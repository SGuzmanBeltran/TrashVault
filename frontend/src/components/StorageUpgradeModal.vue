<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X, Loader2, Check, Sparkles } from 'lucide-vue-next'
import type { StorageTier, StorageTierId } from '@/domain/types'
import { formatBytes } from '@/utils'
import { useStatsService } from '@/services'

const props = defineProps<{
  open: boolean
  currentTier: StorageTierId
  currentMaxBytes: number
}>()

const emit = defineEmits<{
  close: []
}>()

const statsService = useStatsService()
const tiers = ref<StorageTier[]>([])
const isLoadingTiers = ref(false)
const selectedTier = ref<StorageTier | null>(null)
const isUpgrading = ref(false)
const error = ref('')

const sortedTiers = computed(() =>
  [...tiers.value].sort((a, b) => a.maxBytes - b.maxBytes),
)

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function isCurrentTier(tier: StorageTier) {
  return tier.id === props.currentTier
}

function isUnavailable(tier: StorageTier) {
  return tier.maxBytes <= props.currentMaxBytes
}

function tierButtonLabel(tier: StorageTier) {
  if (isCurrentTier(tier)) return 'Current plan'
  if (isUnavailable(tier)) return 'Already included'
  return `Upgrade for ${formatPrice(tier.priceMonthly)}/mo`
}

async function loadTiers() {
  isLoadingTiers.value = true
  error.value = ''
  try {
    tiers.value = await statsService.listStorageTiers()
  } catch {
    error.value = 'Could not load storage plans.'
  } finally {
    isLoadingTiers.value = false
  }
}

function selectTier(tier: StorageTier) {
  if (isCurrentTier(tier) || isUnavailable(tier) || isUpgrading.value) return
  selectedTier.value = tier
}

function cancelConfirm() {
  selectedTier.value = null
}

async function confirmUpgrade() {
  if (!selectedTier.value || isUpgrading.value) return

  isUpgrading.value = true
  error.value = ''
  try {
    const { checkoutUrl } = await statsService.createStorageCheckout(selectedTier.value.id)
    window.location.href = checkoutUrl
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not start checkout.'
    isUpgrading.value = false
    selectedTier.value = null
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      selectedTier.value = null
      error.value = ''
      return
    }
    loadTiers()
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @mousedown.self="emit('close')"
    >
      <div
        class="w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
        @mousedown.stop
      >
        <div class="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h3 class="text-sm font-medium text-surface-fg">Upgrade storage</h3>
            <p class="mt-0.5 text-xs text-surface-fg-subtle">
              Premium plans for people who really, really want to pay for cloud storage.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div v-if="selectedTier" class="p-5">
          <div class="rounded-xl border border-accent/20 bg-accent/5 p-5">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                <Sparkles class="h-5 w-5 text-accent" />
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-medium text-surface-fg">
                  Confirm {{ selectedTier.name }} — {{ formatPrice(selectedTier.priceMonthly) }}/month
                </h4>
                <p class="mt-1 text-sm text-surface-fg-muted">
                  You are about to unlock {{ formatBytes(selectedTier.maxBytes) }} of storage.
                  You'll be redirected to Stripe Checkout (test mode) to approve the subscription.
                </p>
                <p class="mt-2 text-xs text-surface-fg-subtle">
                  {{ selectedTier.tagline }}
                </p>
              </div>
            </div>
          </div>

          <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              :disabled="isUpgrading"
              @click="cancelConfirm"
            >
              Never mind
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-60"
              :disabled="isUpgrading"
              @click="confirmUpgrade"
            >
              <Loader2 v-if="isUpgrading" class="h-4 w-4 animate-spin" />
              Continue to Stripe
            </button>
          </div>
        </div>

        <div v-else class="p-5">
          <div v-if="isLoadingTiers" class="flex items-center justify-center py-10 text-sm text-surface-fg-muted">
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Loading plans...
          </div>

          <div v-else class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="tier in sortedTiers"
              :key="tier.id"
              type="button"
              class="flex flex-col rounded-xl border p-4 text-left transition-all"
              :class="isCurrentTier(tier)
                ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                : isUnavailable(tier)
                  ? 'cursor-not-allowed border-surface-border/60 opacity-60'
                  : 'border-surface-border hover:border-accent/30 hover:bg-surface-overlay/40'"
              :disabled="isCurrentTier(tier) || isUnavailable(tier)"
              @click="selectTier(tier)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-surface-fg">{{ tier.name }}</span>
                <Check v-if="isCurrentTier(tier)" class="h-4 w-4 text-accent" />
              </div>
              <div class="mt-1 text-2xl font-semibold tracking-tight text-surface-fg">
                {{ formatPrice(tier.priceMonthly) }}
                <span class="text-xs font-normal text-surface-fg-subtle">/mo</span>
              </div>
              <div class="mt-2 text-sm font-medium text-accent">
                {{ formatBytes(tier.maxBytes) }}
              </div>
              <p class="mt-2 flex-1 text-xs leading-relaxed text-surface-fg-muted">
                {{ tier.tagline }}
              </p>
              <div
                class="mt-4 rounded-lg px-3 py-2 text-center text-xs font-medium"
                :class="isCurrentTier(tier) || isUnavailable(tier)
                  ? 'bg-surface-overlay text-surface-fg-subtle'
                  : 'bg-accent/10 text-accent'"
              >
                {{ tierButtonLabel(tier) }}
              </div>
            </button>
          </div>

          <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>

          <p class="mt-4 text-center text-xs text-surface-fg-subtle">
            Test card: 4242 4242 4242 4242 · any future date · any CVC
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
