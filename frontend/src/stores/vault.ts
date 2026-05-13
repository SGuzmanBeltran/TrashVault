import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEncryptionService } from '@/services'
import {
  deriveKek,
  generateDek,
  generateSalt,
  encryptDek,
  decryptDek,
  bytesToBase64,
  base64ToBytes,
} from '@/lib/crypto'

const SESSION_STORAGE_KEY = 'tv-vault-password'
const ARGON2_PARAMS_JSON = JSON.stringify({ memory: 65536, iterations: 3, parallelism: 4 })

export const useVaultStore = defineStore('vault', () => {
  const dek = ref<CryptoKey | null>(null)
  const isUnlocked = computed(() => dek.value !== null)
  const isLoading = ref(false)

  const encryptionService = useEncryptionService()

  async function unlock(password: string) {
    isLoading.value = true
    try {
      const keyData = await encryptionService.getKey()
      const salt = base64ToBytes(keyData.dekSalt)
      const iv = base64ToBytes(keyData.dekIv)
      const encryptedDekBytes = base64ToBytes(keyData.encryptedDek)

      const kek = await deriveKek(password, salt)
      dek.value = await decryptDek(encryptedDekBytes, iv, kek)

      sessionStorage.setItem(SESSION_STORAGE_KEY, password)
    } finally {
      isLoading.value = false
    }
  }

  async function initOnRegistration(password: string) {
    isLoading.value = true
    try {
      const newDek = await generateDek()
      const salt = generateSalt()
      const kek = await deriveKek(password, salt)
      const { encryptedDek, iv } = await encryptDek(newDek, kek)

      await encryptionService.createKey({
        encryptedDek: bytesToBase64(encryptedDek),
        dekIv: bytesToBase64(iv),
        dekSalt: bytesToBase64(salt),
        kdfAlgorithm: 'argon2id',
        kdfParams: ARGON2_PARAMS_JSON,
      })

      dek.value = newDek
      sessionStorage.setItem(SESSION_STORAGE_KEY, password)
    } finally {
      isLoading.value = false
    }
  }

  async function tryAutoUnlock() {
    const cached = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!cached) return

    try {
      await unlock(cached)
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  function lock() {
    dek.value = null
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }

  async function reEncryptDek(oldPassword: string, newPassword: string) {
    isLoading.value = true
    try {
      const keyData = await encryptionService.getKey()
      const oldSalt = base64ToBytes(keyData.dekSalt)
      const iv = base64ToBytes(keyData.dekIv)
      const encryptedDekBytes = base64ToBytes(keyData.encryptedDek)

      const oldKek = await deriveKek(oldPassword, oldSalt)
      const currentDek = await decryptDek(encryptedDekBytes, iv, oldKek)

      const newSalt = generateSalt()
      const newKek = await deriveKek(newPassword, newSalt)
      const { encryptedDek: newEncryptedDek, iv: newIv } = await encryptDek(currentDek, newKek)

      await encryptionService.updateKey({
        encryptedDek: bytesToBase64(newEncryptedDek),
        dekIv: bytesToBase64(newIv),
        dekSalt: bytesToBase64(newSalt),
        kdfAlgorithm: 'argon2id',
        kdfParams: ARGON2_PARAMS_JSON,
      })

      dek.value = currentDek
      sessionStorage.setItem(SESSION_STORAGE_KEY, newPassword)
    } finally {
      isLoading.value = false
    }
  }

  return { dek, isUnlocked, isLoading, unlock, initOnRegistration, tryAutoUnlock, lock, reEncryptDek }
})
