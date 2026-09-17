import { directRequest, gatewayRequest, unverifiedEndpointError } from '../api/client';
import { isGatewayRouteUnverified } from '../api/endpoints';
import { ApiError, toApiError } from '../api/ApiError';
import { sessionState } from '../api/session';
import type { Session, SessionUser } from '../api/types';

/**
 * Authentication.
 *
 * PRESERVED FROM THE EXISTING SYSTEM — this is not a second auth stack:
 *   - the login form posts {identifier, password} (the web form fields are
 *     literally named `identifier` and `password`)
 *   - the session is then carried by the backend's cookie AND, when issued, by
 *     an Authorization: Bearer token, exactly as `api()` in the web bundle does
 *   - logout clears the session; 401 from any later call forces the same result
 *
 * Where the web bundle resolves a route server-side, this module calls the
 * gateway route and, if the backend answers "not found", reports that honestly
 * instead of inventing a success.
 */

export type LoginArgs = { identifier: string; password: string };

export type RegisterArgs = {
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  password: string;
};

export type VerificationArgs = { email?: string; code: string; channel?: 'email' | 'phone' };

/** Defensive user extraction: accept the several shapes the server may return. */
function normaliseUser(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const candidate =
    (root.user as unknown) ??
    (root.account as unknown) ??
    (root.profile as unknown) ??
    root;

  if (!candidate || typeof candidate !== 'object') return null;
  const u = candidate as Record<string, unknown>;

  const str = (key: string): string | undefined =>
    typeof u[key] === 'string' ? (u[key] as string) : undefined;
  const bool = (key: string): boolean | undefined =>
    typeof u[key] === 'boolean' ? (u[key] as boolean) : undefined;

  const email = str('email');
  const phone = str('phone');
  if (!email && !phone && !str('id') && !str('name') && !str('full_name')) {
    // Nothing user-shaped in the payload: report no user rather than a fake one.
    return null;
  }

  return {
    id: str('id') ?? str('user_id') ?? str('uuid'),
    name: str('name'),
    fullName: str('full_name') ?? str('fullName') ?? str('name'),
    email,
    phone,
    emailVerified:
      bool('email_verified') ?? bool('emailVerified') ?? (str('email_verified') === '1' ? true : undefined),
    phoneVerified:
      bool('phone_verified') ?? bool('phoneVerified') ?? (str('phone_verified') === '1' ? true : undefined),
    baleVerified: bool('bale_verified') ?? bool('baleVerified'),
    status: str('status'),
    kycStatus: str('kyc_status') ?? str('kycStatus'),
    createdAt: str('created_at') ?? str('createdAt'),
    raw: u,
  };
}

function extractTokens(payload: unknown): { accessToken?: string; csrfToken?: string } {
  if (!payload || typeof payload !== 'object') return {};
  const root = payload as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = root[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    return undefined;
  };
  return {
    accessToken: pick('access_token', 'accessToken', 'token', 'bearer_token'),
    csrfToken: pick('csrf_token', 'csrfToken', 'csrf'),
  };
}

export async function login(args: LoginArgs): Promise<Session> {
  const { data } = await gatewayRequest<unknown>('login', {
    method: 'POST',
    body: { identifier: args.identifier.trim(), password: args.password },
    auth: false,
    timeoutMs: 25_000,
  });

  const tokens = extractTokens(data);
  // BRIX Core intentionally does not return the bearer token in the JSON
  // response; it writes it to the secure HttpOnly cookie. Keep the returned
  // user identity from user_id/public_id and let /api/me provide the profile.
  let user = normaliseUser(data);
  if (!user) {
    const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const userId = root.user_id ?? root.id;
    const publicId = root.public_id;
    user = {
      id: userId !== undefined ? String(userId) : undefined,
      raw: { ...root, public_id: publicId },
    };
  }
  sessionState.setTokens({ accessToken: tokens.accessToken, csrfToken: tokens.csrfToken });

  // Fetch the authoritative profile after authentication. This also proves
  // that the cookie/bearer session is usable from the mobile transport.
  try {
    const me = await gatewayRequest<unknown>('overview', { method: 'GET', timeoutMs: 15_000 });
    const profile = normaliseUser(me.data);
    if (profile) user = { ...user, ...profile, raw: { ...user.raw, ...profile.raw } };
  } catch {
    // Login itself succeeded; keep the minimal identity and let the dashboard
    // surface a normal authenticated API error if the profile cannot load.
  }

  return { accessToken: tokens.accessToken, csrfToken: tokens.csrfToken, user };
}

export async function register(args: RegisterArgs): Promise<{ verificationRequired: boolean; user?: SessionUser }> {
  const { data } = await gatewayRequest<unknown>('register', {
    method: 'POST',
    body: {
      full_name: args.fullName.trim(),
      email: args.email.trim(),
      phone: args.phone.trim(),
      country: args.country,
      password: args.password,
      // The web client sends a country + phone pair; keep the same field names.
      register_country: args.country,
      register_phone: args.phone.trim(),
    },
    auth: false,
  });
  const user = normaliseUser(data);
  return { verificationRequired: true, user: user ?? undefined };
}

export async function logout(): Promise<void> {
  try {
    await gatewayRequest('logout', { method: 'POST' });
  } catch (error) {
    // Logout must always succeed locally, even if the server call fails — the
    // user asked to be signed out and that intent must be honoured.
    const apiError = toApiError(error);
    if (apiError.kind === 'network' || apiError.kind === 'timeout') {
      // Fall through to local teardown.
    }
  } finally {
    sessionState.clear();
  }
}

/**
 * Account verification (email / phone).
 * The web client posts to /account-verification.php with an `action` field:
 *   'begin_verification' | 'verify_code' | 'request' | 'reset'
 */
export async function beginVerification(channel: 'email' | 'phone', target?: string) {
  const { data } = await directRequest<unknown>('account-verification.php', {
    method: 'POST',
    body: { action: 'begin_verification', channel, target },
  });
  return data;
}

export async function verifyCode(args: VerificationArgs) {
  const { data } = await directRequest<unknown>('account-verification.php', {
    method: 'POST',
    body: { action: 'verify_code', code: args.code, email: args.email, channel: args.channel },
  });
  return data;
}

/** Bale messenger verification — /bale-request.php (JSON, credentials included). */
export async function requestBaleVerification(target?: string) {
  const { data } = await directRequest<unknown>('bale-request.php', {
    method: 'POST',
    body: { action: 'request', target },
  });
  return data;
}

/** Password reset — /password-reset.php with action 'request' | 'reset'. */
export async function requestPasswordReset(email: string) {
  const { data } = await directRequest<unknown>('password-reset.php', {
    method: 'POST',
    body: { action: 'request', email: email.trim() },
    auth: false,
  });
  return data;
}

export async function resetPassword(args: { email: string; code: string; newPassword: string }) {
  const { data } = await directRequest<unknown>('password-reset.php', {
    method: 'POST',
    body: {
      action: 'reset',
      email: args.email.trim(),
      code: args.code.trim(),
      new_password: args.newPassword,
    },
    auth: false,
  });
  return data;
}

/** Re-exported so the UI can label an unavailable action precisely. */
export { isGatewayRouteUnverified, unverifiedEndpointError, ApiError };
