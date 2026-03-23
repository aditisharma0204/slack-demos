/** Query flag for links copied via Share demo — hides site navigation to other demos. */
export const SHARED_DEMO_PARAM = 'shared'

export function isSharedDemoQuery(params: URLSearchParams): boolean {
  const v = params.get(SHARED_DEMO_PARAM)
  return v === '1' || v === 'true'
}

export function sharedDemoUrlSuffix(): string {
  return `?${SHARED_DEMO_PARAM}=1`
}

/**
 * Origin used in copied share links. Defaults to `window.location.origin`, which is correct on
 * Heroku, Netlify, localhost, and custom domains—whatever host the user is visiting.
 * Optional: set `VITE_SHARE_BASE_URL` at build time (e.g. Heroku config var) to force a canonical
 * URL (useful if the public URL always differs from the build host).
 */
export function getShareLinkOrigin(): string {
  const fromEnv = import.meta.env.VITE_SHARE_BASE_URL as string | undefined
  if (fromEnv && typeof fromEnv === 'string') {
    const t = fromEnv.trim().replace(/\/$/, '')
    if (t) return t
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}
