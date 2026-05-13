import type { AuthPort } from '@/ports'
import type { User } from '@/domain/types'
import { authClient } from '@/lib/auth-client'

export class HttpAuthAdapter implements AuthPort {
  async login(email: string, password: string): Promise<void> {
    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message ?? 'Login failed')
    }
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    })

    if (error) {
      throw new Error(error.message ?? 'Registration failed')
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const { error } = await authClient.changePassword({
      currentPassword: oldPassword,
      newPassword,
      revokeOtherSessions: false,
    })

    if (error) {
      throw new Error(error.message ?? 'Password change failed')
    }
  }

  async logout(): Promise<void> {
    await authClient.signOut()
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('[Auth] Fetching session...')
    const { data, error } = await authClient.getSession()
    console.log('[Auth] getSession result:', { data, error })

    if (error || !data?.user) {
      console.log('[Auth] No session found')
      return null
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.image ?? undefined,
      createdAt: data.user.createdAt.toISOString(),
    }
  }
}
