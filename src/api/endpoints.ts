/**
 * Central route table — the single source of truth for every BRIX endpoint the
 * mobile client calls.
 *
 * Two calling conventions exist in the existing web client and both are
 * reproduced here:
 *
 *   A) Gateway:   <base>/api.php?route=<encoded-route>
 *      const API = window.BRIX_API || '/api.php'
 *      const makeApiUrl = (path) => API + '?route=' + encodeURIComponent(route)
 *
 *   B) Direct scripts: <base>/<script>.php  (with ?query when needed)
 *
 * Routes below are aligned to the BRIX Core dispatcher currently deployed at
 * api.brixgroup.ir. The gateway prepends `/api/`, so `auth/login` becomes
 * `/api/auth/login`, `wallet/balances` becomes `/api/wallet/balances`, etc.
 */

// ---------------------------------------------------------------------------
// A) Gateway routes
// ---------------------------------------------------------------------------

export const GATEWAY_ROUTES = {
  /** Gateway route -> /api/auth/login */
  login: 'auth/login',
  /** Gateway route -> /api/auth/register */
  register: 'auth/register',
  logout: 'auth/logout',
  overview: 'me',
  wallet: 'wallet/balances',
  transfer: 'transfers',
  transactions: 'transactions',
  paymentResolve: 'payment/resolve',
  paymentExecute: 'payments',
  merchants: 'merchants',
  merchantCreate: 'merchants',
  merchantPay: 'payments',
  fundingCreate: 'funding',
  fundingUsdc: 'funding/usdc',
  fundingManual: 'funding/manual',
  notifications: 'notifications',
} as const;

export type GatewayRouteName = keyof typeof GATEWAY_ROUTES;

// ---------------------------------------------------------------------------
// B) Direct scripts
// ---------------------------------------------------------------------------

export const DIRECT_ENDPOINTS = {
  thenRateEngine: 'rate-engine.php',
  rateEngine: 'rate-engine.php',
  fundingConfig: 'funding-config.php',
  localContext: 'local-context.php',
  cardIssuanceQuote: 'card-issuance-quote.php',
  cardApi: 'card-api.php',
  cardToCard: 'card-to-card.php',
  accountVerification: 'account-verification.php',
  baleRequest: 'bale-request.php',
  passwordReset: 'password-reset.php',
} as const;

/** Sub-routes passed to card-api.php?route=… (strings found in the bundle). */
export const CARD_API_ROUTES = {
  list: '/api/cards',
  detail: '/api/cards/', // + cardId
} as const;

/** Actions used by account-verification.php (found verbatim in the bundle). */
export const ACCOUNT_VERIFICATION_ACTIONS = {
  begin: 'begin_verification',
  verifyCode: 'verify_code',
  request: 'request',
  reset: 'reset',
} as const;

// ---------------------------------------------------------------------------
// Verification status
// ---------------------------------------------------------------------------

/** Endpoints confirmed live (real HTTP 200, response body observed). */
export const VERIFIED_ENDPOINTS: readonly string[] = [
  'rate-engine.php?currency=XX',
  'funding-config.php',
  'local-context.php',
  'card-issuance-quote.php',
  'card-api.php?route=/api/cards',
  'card-api.php?route=/api/cards/{id}',
  'card-to-card.php',
  'account-verification.php',
  'bale-request.php',
  'password-reset.php',
  'api.qrserver.com/v1/create-qr-code',
];

/**
 * Actions that exist in the web UI whose exact gateway route could not be
 * confirmed from the public bundle. Documented in docs/API_MAP.md.
 */
export const UNVERIFIED_ENDPOINTS: readonly GatewayRouteName[] = [
  'paymentResolve',
  'notifications',
];

export function isGatewayRouteUnverified(name: GatewayRouteName): boolean {
  return UNVERIFIED_ENDPOINTS.includes(name);
}

export function gatewayRoute(name: GatewayRouteName): string {
  return GATEWAY_ROUTES[name];
}
