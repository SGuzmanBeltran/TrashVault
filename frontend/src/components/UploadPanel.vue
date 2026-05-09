<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronUp, Upload } from 'lucide-vue-next'
import { useUploadQueue } from '@/composables/useUploadQueue'
import UploadProgressItem from '@/components/UploadProgressItem.vue'

const queue = useUploadQueue()
const isExpanded = ref(false)

watch(
  () => queue.activeCount.value,
  (count) => {
    if (count > 0) {
      isExpanded.value = true
    }
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="queue.hasUploads.value"
      class="fixed bottom-20 right-6 z-40 w-80"
    >
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="max-h-0 opacity-0 -translate-y-2"
        enter-to-class="max-h-96 opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="max-h-96 opacity-100 translate-y-0"
        leave-to-class="max-h-0 opacity-0 -translate-y-2"
      >
        <div
          v-if="isExpanded"
          class="mb-2 space-y-2 overflow-hidden"
        >
          <UploadProgressItem
            v-for="item in queue.uploads.value"
            :key="item.id"
            :item="item"
            @cancel="queue.cancelUpload"
            @dismiss="queue.dismiss"
            @retry="queue.retryUpload"
          />
        </div>
      </Transition>

      <button
        class="flex w-full items-center gap-2.5 rounded-xl border border-surface-border bg-surface-raised/95 px-4 py-2.5 shadow-lg shadow-black/20 backdrop-blur-sm transition-all hover:bg-surface-raised hover:shadow-xl hover:shadow-black/30"
        @click="isExpanded = !isExpanded"
      >
        <div
          v-if="queue.activeCount.value > 0"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tabular-nums text-accent-fg"
        >
          {{ queue.activeCount.value }}
        </div>
        <Upload
          v-else
          class="h-4 w-4 shrink-0 text-success"
        />

        <span class="flex-1 text-left text-[13px] font-medium text-surface-fg">
          <template v-if="queue.activeCount.value > 0">
            {{ queue.activeCount.value }} uploading{{ queue.activeCount.value > 1 ? '' : '' }}
          </template>
          <template v-else>
            Uploads complete
          </template>
        </span>

        <span class="text-[11px] text-surface-fg-muted">
          {{ queue.uploads.value.filter((u) => u.status === 'completed').length }}/{{
            queue.uploads.value.length
          }}
        </span>

        <ChevronUp
          class="h-4 w-4 shrink-0 text-surface-fg-subtle transition-transform duration-200"
          :class="isExpanded ? '' : 'rotate-180'"
        />
      </button>
    </div>
  </Transition>
</template>
