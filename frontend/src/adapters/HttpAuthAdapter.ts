import type { AuthPort } from '@/ports'
import type { LoginResult, TwoFactorSetupResult, User } from '@/domain/types'
import { authClient } from '@/lib/auth-client'

function mapUser(data: {
  id: string
  email: string
  name: string
  image?: string | null
  createdAt: Date
  twoFactorEnabled?: boolean | null
}): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.image ?? undefined,
    createdAt: data.createdAt.toISOString(),
    twoFactorEnabled: data.twoFactorEnabled ?? false,
  }
}

export class HttpAuthAdapter implements AuthPort {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message ?? 'Login failed')
    }

    if (data && typeof data === 'object' && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
      return { needsTwoFactor: true }
    }

    return { needsTwoFactor: false }
  }

  async verifyTwoFactor(
    code: string,
    options?: { backupCode?: boolean; trustDevice?: boolean },
  ): Promise<void> {
    const trustDevice = options?.trustDevice ?? true
    const { error } = options?.backupCode
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice })

    if (error) {
      throw new Error(error.message ?? 'Verification failed')
    }
  }

  async enableTwoFactor(password: string): Promise<TwoFactorSetupResult> {
    const { data, error } = await authClient.twoFactor.enable({ password })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to enable two-factor authentication')
    }

    return {
      totpURI: data.totpURI,
      backupCodes: data.backupCodes,
    }
  }

  async verifyTwoFactorEnrollment(code: string): Promise<void> {
    const { error } = await authClient.twoFactor.verifyTotp({ code })

    if (error) {
      throw new Error(error.message ?? 'Invalid verification code')
    }
  }

  async disableTwoFactor(password: string): Promise<void> {
    const { error } = await authClient.twoFactor.disable({ password })

    if (error) {
      throw new Error(error.message ?? 'Failed to disable two-factor authentication')
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
    const { data, error } = await authClient.getSession()

    if (error || !data?.user) {
      return null
    }

    return mapUser(data.user)
  }
}
