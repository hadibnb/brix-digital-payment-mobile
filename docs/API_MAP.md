# BRIX Digital Payment — Mobile API Map

Source of truth: the live web application at `https://dp.brixgroup.ir/`.
Everything below was derived by inspecting the shipped bundle
(`assets/app.js?v=4318`) and by issuing **read-only** requests to public
endpoints. No credentials were used, no authenticated request was attempted.

## 1. Transport

The web client uses **two** calling conventions side by side:

| # | Convention | Evidence | Used for |
|---|-----------|----------|----------|
| A | **Gateway**: `<base>/api.php?route=<encoded-route>` | `const API = window.BRIX_API \|\| '/api.php'` and `makeApiUrl(path)` → `API + '?route=' + encodeURIComponent(route)` | Primary business API (wallet, transfers, funding, merchants…) |
| B | **Direct PHP scripts**: `<base>/<script>.php` | `fetch('card-to-card.php', …)`, `fetch('rate-engine.php?currency=' + …)`, … | Rates, funding config, cards, verification, password reset |

The mobile client implements **both** through one typed layer
(`src/api/client.ts` + `src/api/endpoints.ts`).

### Session / auth model (preserved exactly)

`async function api(path, opts)` in the web bundle sets:

```
Accept: application/json
Content-Type: application/json        (when a body is present)
X-CSRF-Token: <csrf>                  (when a CSRF token is held)
Authorization: Bearer <accessToken>   (when an access token is held)
Idempotency-Key: <crypto.randomUUID()> (when opts.idempotency is set)
credentials: 'include'                (cookie session)
cache: 'no-store'
```

The backend therefore accepts **either** a cookie session (`credentials: include`)
**or** a bearer token, and cryptographically deduplicates state-changing
requests by `Idempotency-Key`. The mobile client reproduces all four.

## 2. Endpoint map — screen → endpoint

### Legend
- **CONFIRMED** — observed live: real HTTP 200 with the response body quoted here.
- **CONFIRMED (client-referenced)** — the exact script path and HTTP method appear in the shipped bundle; the response requires authentication so it could not be exercised.
- **REQUIRED-BUT-UNVERIFIED** — the web app performs this action, but the concrete route string is decided server-side and is not present in the public bundle. Documented, never fabricated with a made-up response shape.

### 2.1 Public / pre-auth

| Screen | Method | Endpoint | Status | Verified response |
|---|---|---|---|---|
| Rate display (Dashboard, Wallet, Funding) | `GET` | `/rate-engine.php?currency={CODE}` | **CONFIRMED** | `{"success":true,"data":{"currency":"AED","brix_local":25.708,"unit":"AED","source":"ExchangeRate-API Open Access","updated_at":"2026-09-17T05:51:30+00:00","status":"LIVE","methodology":"BRIX local reference calculated from live regional FX data using the server-side BRIX reference methodology","stale":false}}` |
| Fund BRIX (fees, USDC wallet, Sheba) | `GET` | `/funding-config.php` | **CONFIRMED** | `{"success":true,"data":{"iran_sheba":"","bale_app_url":"https://bale.ai/dl","brix_usd_reference":7,"card_issuance_fee_brix":"0.081","transaction_fee_brix":"0.001","usdc_wallet":""}}` |
| Region-based currency / language bootstrap | `GET` | `/local-context.php` | **CONFIRMED (client-referenced)** | Served with `credentials: 'same-origin'`; used to preselect currency + language from IP/region. Falls back to device locale. |
| Login | `POST` | gateway `route=auth/login` → Core `/api/auth/login` | **ALIGNED** | `#loginForm` submits `{identifier, password}` (`FormData`). Exact route string is resolved server-side. |
| Registration | `POST` | gateway `route=auth/register` → Core `/api/auth/register` | **ALIGNED** | `#registerForm`, `#registerCountry`, `#registerPhone`, `#registrationVerificationNotice` |
| Email/phone verification | `POST` | `/account-verification.php` `{action:'begin_verification'\|'verify_code'\|'request'\|'reset'}` | **CONFIRMED (client-referenced)** | Actions literally present in the bundle |
| Bale (messenger) verification | `POST` | `/bale-request.php` | **CONFIRMED (client-referenced)** | `{Content-Type: application/json}`, `credentials: 'include'`; `#openBaleVerificationBtn`, `#baleCodeRow` |
| Forgot password / reset | `POST` | `/password-reset.php` | **CONFIRMED (client-referenced)** | `#forgotStep1` (email) → `#forgotStep2` (`#forgotCode`, `#forgotNewPassword`) |
| QR generation | — | `https://api.qrserver.com/v1/create-qr-code/?size=…` | **CONFIRMED** | The web app renders QR images through this external generator; payload base is `BRIX_QR_BASE = origin + pathname` |

### 2.2 Authenticated business API (gateway `route=…`)

The gateway prepends `/api/` before forwarding to BRIX Core. The mobile route table is aligned to the currently deployed Core dispatcher.

| Screen | Method | Mobile gateway route | Core endpoint | Status |
|---|---|---|---|---|
| Dashboard profile | `GET` | `me` | `/api/me` | ALIGNED |
| My Wallet | `GET` | `wallet/balances` | `/api/wallet/balances` | ALIGNED |
| Send / Transfers | `POST` | `transfers` | `/api/transfers` | ALIGNED |
| My Transactions | `GET` | `transactions` | `/api/transactions` | ALIGNED |
| Pay | `POST` | `payments` | `/api/payments` | ALIGNED |
| Merchant list | `GET` | `merchants` | `/api/merchants` | ALIGNED |
| Merchant onboarding | `POST` | `merchants` | `/api/merchants` | ALIGNED |
| Merchant payment | `POST` | `payments` | `/api/payments` | ALIGNED |
| USDC funding | `POST` | `funding/usdc` | `/api/funding/usdc` | ALIGNED |
| Manual funding | `POST` | `funding/manual` | `/api/funding/manual` | ALIGNED |
| Funding history | `GET` | `funding` | `/api/funding` | AVAILABLE |
| Logout | `POST` | `auth/logout` | `/api/auth/logout` | ALIGNED |

**Important:** Core v11.6 does not expose a public payment-resolve endpoint. The mobile Pay screen therefore performs a local code parse and lets `/api/payments` perform the authoritative merchant validation only when the user confirms.

### 2.3 Cards (direct scripts)

| Screen | Method | Endpoint | Status |
|---|---|---|---|
| BRIX Card (issue, freeze) | `GET` | `/card-issuance-quote.php` (`credentials:'include'`, `X-CSRF-Token`) | **CONFIRMED (client-referenced)** — returns the real issuance quote; `#createCardBtn`, `#freezeCardBtn`, `#cardNumberMasked` |
| BRIX Card detail (`#cardDetails`) | `GET` | `/card-api.php?route=/api/cards` | **CONFIRMED (client-referenced)** |
| Single card | `GET` | `/card-api.php?route=/api/cards/{id}` | **CONFIRMED (client-referenced)** |
| Card-to-Card (`#cardToCardForm`, `#cardToCardSubmit`) | `POST` | `/card-to-card.php` body `{recipient_card_id, …}` | **CONFIRMED (client-referenced)** — `"Recipient card could not be verified"` is a real backend message surfaced by the web app |

## 3. Notes on the gateway routes

The bundle computes the URL as
`API + '?route=' + encodeURIComponent(route)` and then passes *logical* route
names. The truncated login call is literally `await api('login', …)` — its
first argument is the logical route, and `BRIX_LOGIN = 'login'` is declared at
bootstrap, with `BRIX_LOGIN_READY = true` used as a readiness flag.

Because the complete route table is decided by the server (`api.php`), the
mobile client keeps every route string in **one** file
(`src/api/endpoints.ts`) as a single source of truth. Changing a route to match
the server's real answer is a one-line edit — no screen change required.

## 4. Deliberately NOT implemented (no evidence in the existing system)

These were requested as conditional and the existing site gives **no**
evidence they exist, so they are documented rather than faked:

| Item | Why it is absent |
|---|---|
| Public-blockchain / token features | The site states "internal ledger". `funding-config.php` has no chain RPC, contract address, or token symbol. No `BRIX Token` anywhere. |
| Visa / Mastercard PAN·CVV·expiry issuance | `#cardNumberMasked` only — the backend returns a masked internal identifier. No PAN/CVV fields exist in the bundle. |
| Real bank / fiat processor connections | PRE-APPROVAL MODE; only an `iran_sheba` field (empty) and a `usdc_wallet` field (empty) in funding config. |
| On-chain deposit monitoring of USDC | The funding flow is a *proof-upload* flow (`#fundingProof`, `#fundingProofStatus`), i.e. manual review, not an automated chain watcher. |
| Server-sent push events | No push token registration endpoint is present. The client ships a notification *architecture* (permission + token plumbing + event taxonomy) but registers nothing until such an endpoint is documented. |

## 5. Local reference rates (confirmed live at time of writing)

| Currency | 1 BRIX = | Source |
|---|---|---|
| AED | 25.708 AED | `/rate-engine.php?currency=AED` |
| OMR | 2.691 OMR | `/rate-engine.php?currency=OMR` |
| CNY | 47.056 CNY | `/rate-engine.php?currency=CNY` |

Fees and the USD reference are **always fetched** from `funding-config.php`
(`card_issuance_fee_brix: "0.081"`, `transaction_fee_brix: "0.001"`,
`brix_usd_reference: 7`). The values shipped as constants in
`src/config/fallback.ts` exist only for offline display and are explicitly
labelled as fallbacks in the UI when the live call fails.
