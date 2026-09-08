import { verifyToken } from '@clerk/backend'
import { CLOUD_POLICY } from '../../shared/cloudPolicy'

export interface AccountEnv {
  CLERK_JWT_KEY?: string
  CLERK_SECRET_KEY?: string
  CLERK_ISSUER?: string
  PRISM_APP_ORIGIN?: string
  CLOUD_STORAGE_ENABLED?: string
  CLOUD_STORAGE_MODE?: string
}

const reply = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})

/** Read-only integration probe. Authentication never enrolls or uploads a library. */
export async function authenticateAccount(request: Request, env: AccountEnv): Promise<Response | { accountId: string }> {
  if ((!env.CLERK_JWT_KEY && !env.CLERK_SECRET_KEY) || !env.CLERK_ISSUER || !env.PRISM_APP_ORIGIN ||
    (env.CLOUD_STORAGE_MODE === 'remote' && !env.CLERK_SECRET_KEY?.startsWith('sk_live_'))) {
    return reply({ error: 'Account connection is not configured on this server.' }, 503)
  }
  const origin = request.headers.get('Origin')
  if ((origin && origin !== env.PRISM_APP_ORIGIN) || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return reply({ error: 'Open your account from PRISM.' }, 403)
  }
  const authorization = request.headers.get('Authorization') ?? ''
  if (!authorization.startsWith('Bearer ') || authorization.length > 8192) {
    return reply({ error: 'Sign in to connect your account.' }, 401)
  }
  try {
    const token = await verifyToken(authorization.slice(7), {
      // Production discovers rotating signing keys through the provider SDK.
      // The pinned public key remains available for isolated local development.
      ...(env.CLOUD_STORAGE_MODE === 'remote' ? { secretKey: env.CLERK_SECRET_KEY } : { jwtKey: env.CLERK_JWT_KEY, secretKey: env.CLERK_SECRET_KEY }),
      authorizedParties: [env.PRISM_APP_ORIGIN],
      clockSkewInMs: 5000,
    })
    // Require a session, exact issuer and azp even if an SDK version permits omission.
    if (token.iss !== env.CLERK_ISSUER || token.azp !== env.PRISM_APP_ORIGIN ||
      typeof token.sub !== 'string' || !token.sub.startsWith('user_') ||
      typeof token.sid !== 'string' || !token.sid.startsWith('sess_') ||
      typeof token.exp !== 'number' || !Number.isFinite(token.exp) ||
      typeof token.iat !== 'number' || token.exp - token.iat > 120 ||
      token.exp * 1000 <= Date.now() || token.sts === 'pending') {
      return reply({ error: 'Sign in again to connect your account.' }, 401)
    }
    return { accountId: token.sub }
  } catch {
    // Do not return or log tokens, SDK errors or identity-provider responses.
    return reply({ error: 'Sign in again to connect your account.' }, 401)
  }
}

export async function accountSession(request: Request, env: AccountEnv): Promise<Response> {
  if (request.method !== 'GET') return reply({ error: 'Method not allowed.' }, 405)
  const account = await authenticateAccount(request, env)
  if (account instanceof Response) return account
  return reply({ ...account, cloudStorage: { enabled: env.CLOUD_STORAGE_ENABLED === 'true', quotaBytes: CLOUD_POLICY.quotaBytes } })
}
