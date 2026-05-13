import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  createdAt: number
}

let idCounter = 0

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  function show(type: NotificationType, message: string) {
    const id = `notif-${++idCounter}`
    notifications.value.push({ id, type, message, createdAt: Date.now() })

    setTimeout(() => {
      dismiss(id)
    }, 4000)
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function success(message: string) {
    show('success', message)
  }

  function error(message: string) {
    show('error', message)
  }

  function info(message: string) {
    show('info', message)
  }

  return { notifications, show, dismiss, success, error, info }
})
