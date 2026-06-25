<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useUploadConflict, type UploadConflictAction } from '@/composables/useUploadConflict'

const conflict = useUploadConflict()
const applyToAll = ref(false)

watch(
  () => conflict.visible.value,
  (visible) => {
    if (visible) applyToAll.value = false
  },
)

function choose(action: UploadConflictAction) {
  conflict.respond(action, applyToAll.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="conflict.visible.value && conflict.prompt.value"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
        @mousedown.stop
      >
        <div class="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h3 class="text-sm font-medium text-surface-fg">File already exists</h3>
            <p class="mt-0.5 text-xs text-surface-fg-subtle">
              <span class="font-medium text-surface-fg">{{ conflict.prompt.value.fileName }}</span>
              is already in this folder
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="choose('skip')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="px-5 py-4">
          <p class="text-sm text-surface-fg-muted">
            Choose what to do with the incoming file.
            <template v-if="conflict.prompt.value.remainingCount > 0">
              {{ conflict.prompt.value.remainingCount }} more conflict{{
                conflict.prompt.value.remainingCount === 1 ? '' : 's'
              }}
              in this batch.
            </template>
          </p>
        </div>

        <div class="flex flex-col gap-2 border-t border-surface-border px-5 py-4">
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110"
            @click="choose('replace')"
          >
            Replace existing file
          </button>
          <button
            type="button"
            class="rounded-lg border border-surface-border px-4 py-2.5 text-sm font-medium text-surface-fg transition-colors hover:bg-surface-overlay"
            @click="choose('keepBoth')"
          >
            Keep both (auto-rename)
          </button>
          <button
            type="button"
            class="rounded-lg px-4 py-2.5 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="choose('skip')"
          >
            Skip
          </button>

          <label
            v-if="conflict.prompt.value.remainingCount > 0"
            class="mt-1 flex cursor-pointer items-center gap-2 text-xs text-surface-fg-subtle"
          >
            <input
              v-model="applyToAll"
              type="checkbox"
              class="rounded border-surface-border bg-surface-raised text-accent focus:ring-accent/30"
            />
            <span>Apply choice to all remaining conflicts</span>
          </label>
        </div>
      </div>
    </div>
  </Teleport>
</template>
