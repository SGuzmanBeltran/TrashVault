<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useItemMenuRegistry } from '@/composables/useItemMenuRegistry'

const props = defineProps<{
  menuKey: string
}>()

const registry = useItemMenuRegistry()
const buttonRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const isOpen = computed(() => registry.openMenuKey.value === props.menuKey)

function toggle() {
  if (isOpen.value) {
    registry.close()
    return
  }
  if (buttonRef.value) {
    registry.open(props.menuKey, buttonRef.value)
  }
}

function close() {
  registry.closeIf(props.menuKey)
}

function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value) return
  const target = event.target as Node
  if (buttonRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  close()
}

function onScrollOrResize() {
  if (isOpen.value && buttonRef.value) {
    registry.updatePosition(buttonRef.value)
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', onDocumentClick)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
  } else {
    document.removeEventListener('click', onDocumentClick)
    window.removeEventListener('scroll', onScrollOrResize, true)
    window.removeEventListener('resize', onScrollOrResize)
  }
})

onUnmounted(() => {
  close()
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

defineExpose({ close, toggle, isOpen })
</script>

<template>
  <div>
    <div ref="buttonRef">
      <slot name="trigger" :toggle="toggle" :open="isOpen" :close="close" />
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="scale-95 opacity-0"
        enter-to-class="scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="scale-100 opacity-100"
        leave-to-class="scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          ref="panelRef"
          class="fixed z-[100] w-40 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
          :style="{ top: `${registry.position.value.top}px`, right: `${registry.position.value.right}px` }"
          @mousedown.stop
        >
          <div class="p-1">
            <slot name="menu" :close="close" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
