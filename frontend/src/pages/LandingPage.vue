<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Shield,
  Upload,
  FolderTree,
  Lock,
  Trash2,
  Server,
  ArrowRight,
  HardDrive,
  KeyRound,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const features = [
  {
    icon: Upload,
    title: 'Upload anything',
    description: 'Drag and drop files of any type. Your vault handles the rest with chunked uploads and conflict resolution.',
  },
  {
    icon: FolderTree,
    title: 'Stay organized',
    description: 'Folders, search, and a clean file browser — everything you expect from cloud storage, without the cloud.',
  },
  {
    icon: Lock,
    title: 'Encrypted vault',
    description: 'Client-side encryption keeps your files locked behind a passphrase only you know. We never see your keys.',
  },
  {
    icon: Trash2,
    title: 'Trash with recovery',
    description: 'Deleted something by mistake? Recover files from trash before they are gone for good.',
  },
  {
    icon: Server,
    title: 'Self-hosted',
    description: 'Run it on your own infrastructure. PostgreSQL for metadata, S3-compatible storage for files.',
  },
  {
    icon: KeyRound,
    title: 'Two-factor auth',
    description: 'Protect your account with TOTP two-factor authentication for an extra layer of security.',
  },
]

const steps = [
  { number: '01', title: 'Deploy', description: 'Spin up Trashvault on your server with Bun, PostgreSQL, and R2 or MinIO.' },
  { number: '02', title: 'Create your vault', description: 'Register, set a passphrase, and unlock your encrypted personal storage.' },
  { number: '03', title: 'Store freely', description: 'Upload, organize, and access your files from anywhere you host it.' },
]
</script>

<template>
  <div class="landing min-h-screen bg-surface text-surface-fg">
    <!-- Ambient background -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="landing-glow landing-glow--top" />
      <div class="landing-glow landing-glow--bottom" />
      <div class="landing-grid" />
    </div>

    <!-- Nav -->
    <header class="relative z-10 border-b border-surface-border/60 bg-surface/80 backdrop-blur-md">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <Shield class="h-5 w-5 text-accent" />
          </div>
          <span class="text-lg font-semibold tracking-tight">Trashvault</span>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="isAuthenticated">
            <RouterLink
              to="/dashboard"
              class="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Open dashboard
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="rounded-lg px-4 py-2 text-sm font-medium text-surface-fg-muted transition-colors hover:text-surface-fg"
            >
              Sign in
            </RouterLink>
            <RouterLink
              to="/register"
              class="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Get started
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </template>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
      <div class="animate-in mx-auto max-w-3xl text-center">
        <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised/80 px-3.5 py-1.5 text-xs font-medium text-surface-fg-muted backdrop-blur-sm">
          <HardDrive class="h-3.5 w-3.5 text-accent" />
          Self-hosted personal cloud storage
        </div>

        <h1 class="landing-display text-4xl font-bold leading-[1.1] tracking-tight text-surface-fg sm:text-5xl md:text-6xl">
          Your files.
          <span class="text-accent">Your server.</span>
          Your rules.
        </h1>

        <p class="animate-in animate-stagger-1 mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface-fg-muted md:text-lg">
          Trashvault is a Google Drive-like storage app you run yourself — with encrypted vaults,
          folder organization, and S3-compatible object storage under the hood.
        </p>

        <div class="animate-in animate-stagger-2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <RouterLink
            :to="isAuthenticated ? '/dashboard' : '/register'"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-all hover:brightness-110 active:scale-[0.98] sm:w-auto"
          >
            {{ isAuthenticated ? 'Go to dashboard' : 'Create your vault' }}
            <ArrowRight class="h-4 w-4" />
          </RouterLink>
          <RouterLink
            v-if="!isAuthenticated"
            to="/login"
            class="flex w-full items-center justify-center rounded-xl border border-surface-border bg-surface-raised/60 px-6 py-3 text-sm font-medium text-surface-fg transition-colors hover:border-accent/30 hover:bg-surface-raised sm:w-auto"
          >
            Sign in to existing account
          </RouterLink>
        </div>
      </div>

      <!-- Preview card -->
      <div class="animate-in animate-stagger-3 relative mx-auto mt-16 max-w-4xl">
        <div class="absolute -inset-px rounded-2xl bg-gradient-to-b from-accent/20 via-transparent to-transparent" />
        <div class="relative overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/90 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div class="flex items-center gap-2 border-b border-surface-border px-4 py-3">
            <div class="h-2.5 w-2.5 rounded-full bg-danger/80" />
            <div class="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <div class="h-2.5 w-2.5 rounded-full bg-success/80" />
            <span class="ml-2 font-mono text-xs text-surface-fg-subtle">trashvault — dashboard</span>
          </div>
          <div class="grid gap-4 p-6 sm:grid-cols-3">
            <div class="rounded-xl border border-surface-border bg-surface p-4">
              <p class="text-xs font-medium text-surface-fg-subtle">Total files</p>
              <p class="mt-1 font-mono text-2xl font-semibold text-surface-fg">1,284</p>
            </div>
            <div class="rounded-xl border border-surface-border bg-surface p-4">
              <p class="text-xs font-medium text-surface-fg-subtle">Storage used</p>
              <p class="mt-1 font-mono text-2xl font-semibold text-accent">24.6 GB</p>
            </div>
            <div class="rounded-xl border border-surface-border bg-surface p-4">
              <p class="text-xs font-medium text-surface-fg-subtle">Vault status</p>
              <p class="mt-1 flex items-center gap-1.5 text-sm font-medium text-success">
                <Lock class="h-3.5 w-3.5" />
                Unlocked
              </p>
            </div>
          </div>
          <div class="border-t border-surface-border px-6 py-4">
            <div class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border bg-surface/50 px-4 py-6 text-sm text-surface-fg-muted">
              <Upload class="h-5 w-5 text-accent" />
              <span>Drop files here to upload</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="relative z-10 border-t border-surface-border/60 bg-surface-raised/30 py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-semibold tracking-tight text-surface-fg md:text-3xl">
            Everything you need, nothing you don't
          </h2>
          <p class="mt-3 text-surface-fg-muted">
            Built for people who want full control over where their data lives.
          </p>
        </div>

        <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(feature, i) in features"
            :key="feature.title"
            class="animate-in group rounded-2xl border border-surface-border bg-surface-raised/60 p-6 transition-colors hover:border-accent/25 hover:bg-surface-raised"
            :class="`animate-stagger-${(i % 6) + 1}`"
          >
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/15">
              <component :is="feature.icon" class="h-5 w-5 text-accent" />
            </div>
            <h3 class="font-semibold text-surface-fg">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-fg-muted">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="relative z-10 py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-semibold tracking-tight text-surface-fg md:text-3xl">
            Up and running in minutes
          </h2>
          <p class="mt-3 text-surface-fg-muted">
            No vendor lock-in. No surprise bills. Just your files on your terms.
          </p>
        </div>

        <div class="mt-14 grid gap-8 md:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="relative"
          >
            <span class="font-mono text-4xl font-bold text-accent/20">{{ step.number }}</span>
            <h3 class="mt-2 text-lg font-semibold text-surface-fg">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-surface-fg-muted">
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="relative z-10 border-t border-surface-border/60 py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-raised px-8 py-16 text-center md:px-16">
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-transparent" />
          <div class="relative">
            <Shield class="mx-auto h-10 w-10 text-accent" />
            <h2 class="mt-6 text-2xl font-semibold tracking-tight text-surface-fg md:text-3xl">
              Ready to take control of your files?
            </h2>
            <p class="mx-auto mt-3 max-w-md text-surface-fg-muted">
              {{ isAuthenticated ? 'Your vault is waiting.' : 'Create an account and start storing files on your own infrastructure.' }}
            </p>
            <RouterLink
              :to="isAuthenticated ? '/dashboard' : '/register'"
              class="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {{ isAuthenticated ? 'Open dashboard' : 'Get started free' }}
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 border-t border-surface-border/60 py-8">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-surface-fg-subtle sm:flex-row">
        <div class="flex items-center gap-2">
          <Shield class="h-4 w-4 text-accent/60" />
          <span>Trashvault</span>
        </div>
        <p>Self-hosted file storage · Vue 3 · Bun · PostgreSQL · S3</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-display {
  font-family: "Syne", "DM Sans", system-ui, sans-serif;
}

.landing-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.landing-glow--top {
  top: -20%;
  left: 50%;
  width: 600px;
  height: 400px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, #22d3ee12 0%, transparent 70%);
}

.landing-glow--bottom {
  bottom: 10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(ellipse, #22d3ee08 0%, transparent 70%);
}

.landing-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-surface-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-surface-border) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%);
  opacity: 0.35;
}
</style>
