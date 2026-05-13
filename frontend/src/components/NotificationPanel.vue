<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification'
import NotificationItem from './NotificationItem.vue'

const notificationStore = useNotificationStore()
</script>

<template>
  <div class="fixed bottom-20 right-4 z-50 flex w-72 flex-col gap-2 lg:right-6 lg:w-80">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-4 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-4 opacity-0"
    >
      <NotificationItem
        v-for="n in notificationStore.notifications"
        :key="n.id"
        :notification="n"
        @dismiss="notificationStore.dismiss"
      />
    </TransitionGroup>
  </div>
</template>
