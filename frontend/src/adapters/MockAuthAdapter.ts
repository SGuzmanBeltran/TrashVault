import type { AuthPort } from '@/ports'
import type { User } from '@/domain/types'

const MOCK_DELAY = 800

const MOCK_USER: User = {
  id: 'user-1',
  email: 'demo@trashvault.dev',
  name: 'Alex Rivera',
  createdAt: '2026-01-15T10:00:00Z',
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockAuthAdapter implements AuthPort {
  private currentUser: User | null = null

  async login(email: string, _password: string): Promise<void> {
    await delay(MOCK_DELAY)
    this.currentUser = { ...MOCK_USER, email }
  }

  async logout(): Promise<void> {
    await delay(300)
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(200)
    return this.currentUser
  }
}
