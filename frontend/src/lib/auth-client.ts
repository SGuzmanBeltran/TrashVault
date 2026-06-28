import { createAuthClient } from 'better-auth/client'
import { twoFactorClient } from 'better-auth/client/plugins'

type TwoFactorRedirectHandler = (context: { twoFactorMethods?: string[] }) => void | Promise<void>

let twoFactorRedirectHandler: TwoFactorRedirectHandler | null = null

export function setTwoFactorRedirectHandler(handler: TwoFactorRedirectHandler) {
  twoFactorRedirectHandler = handler
}

export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/auth`,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect(context) {
        return twoFactorRedirectHandler?.(context)
      },
    }),
  ],
})
