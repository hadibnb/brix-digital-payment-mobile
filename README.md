# BRIX Digital Payment — Mobile Client (Android + iOS)

A production-structured cross-platform mobile application for the **existing**
BRIX Digital Payment platform at `https://dp.brixgroup.ir/`.

It is a **real mobile client**, not a WebView wrapper and not a new backend: every
screen talks to the same BRIX backend and API that the web portal uses.

| | |
|---|---|
| Framework | Expo SDK 52 / React Native 0.76 / expo-router 4 (TypeScript, strict) |
| Targets | Android APK, Android AAB, iOS IPA |
| Backend | `https://dp.brixgroup.ir` (existing — reused, not recreated) |
| Languages | en · fa · ar · tr · ru · hi (LTR + RTL) |
| Currencies | 26 (AED, OMR, CNY, …) with live local-reference rates |
| Mode | **PRE-APPROVAL** — internal BRIX ledger. No bank/fiat integration is claimed. |

---

## 1. How the existing system was inspected

The live portal is a single-page app shipping `assets/app.js?v=4318`. Its full
bundle, stylesheet and `manifest.json` were fetched and read, and the public
endpoints were called read-only (no credentials, no login attempted). Findings:

* **Two calling conventions** — a central gateway `api.php?route=<encoded>` and
  direct PHP scripts (`rate-engine.php`, `funding-config.php`, `card-api.php`, …).
  Both are reproduced in `src/api/`.
* **Auth model** — the web `api()` helper sends `Accept`, `Content-Type`,
  `X-CSRF-Token`, `Authorization: Bearer …`, `Idempotency-Key`, with
  `credentials: 'include'` and `cache: 'no-store'`. The mobile client sends the
  exact same header set.
* **Routes** — `data-view` values: `overview`, `wallet`, `card`, `card-to-card`,
  `payments`, `merchant`, `transfers`, `transactions`, `funding`, `receive`,
  `settings`. Forms: `#loginForm`, `#registerForm`, `#forgotPasswordForm`,
  `#transferForm`, `#cardToCardForm`, `#merchantForm`, `#merchantPaymentForm`,
  `#fundingForm`.
* **Brand** — CSS tokens `--navy:#071321`, `--panel:#0c1d2e`, `--line:#1b3045`,
  `--text:#edf2f7`, `--muted:#91a0af`, `--gold:#caa65a`, `--ok:#67c69b`,
  `--danger:#d86b6b`; theme `#0b1220`. All are carried into `src/theme/`.
* **Logo** — `https://dp.brixgroup.ir/assets/bdp.png`. The app icons and splash
  in `assets/` are generated from that same file, so the identity is identical.

Full detail, including which endpoints are live-verified, is in
**[docs/API_MAP.md](docs/API_MAP.md)**.

---

## 2. Project structure

```
brix-digital-payment/
├─ app/                          # expo-router routes (file = screen)
│  ├─ _layout.tsx                # boot: i18n → session → route; 401 redirects
│  ├─ index.tsx                  # entry redirect
│  ├─ (auth)/                    # sign-in, register, verify, forgot-password, lock
│  ├─ (tabs)/                    # dashboard, wallet, card, transactions, more, account
│  ├─ send.tsx  receive.tsx  pay.tsx  scan.tsx
│  ├─ card-to-card.tsx  funding.tsx  merchant.tsx
│  ├─ notifications.tsx  receipt.tsx  transaction/[id].tsx
├─ src/
│  ├─ api/       client.ts  endpoints.ts  session.ts  ApiError.ts  types.ts
│  ├─ services/  auth.ts  wallet.ts  transactions.ts  cards.ts  payments.ts
│  │             rates.ts  notifications.ts
│  ├─ state/     authStore.ts (zustand + SecureStore)  uiStore.ts
│  ├─ hooks/     useAsync.ts  useRate.ts  useNetworkStatus.ts
│  │             useSessionExpiryRedirect.ts
│  ├─ i18n/      index.ts  resources.ts  locales/{en,fa,ar,tr,ru,hi}.ts
│  ├─ components/ ui/  AppHeader  ScreenScroll  ConfirmSheet  PickerSheet
│  │             RateBadge  TransactionCard  OfflineBanner  Logo
│  │             LanguageCurrencyBar
│  ├─ config/    env.ts  fallback.ts
│  ├─ theme/     index.ts
│  └─ utils/     format.ts  validation.ts  idempotency.ts
├─ docs/         API_MAP.md  BUILD.md  TESTING.md
├─ assets/       icon.png  adaptive-icon.png  splash.png  notification-icon.png
├─ app.json  eas.json  babel.config.js  tsconfig.json  .env.example
```

---

## 3. Navigation (mobile-first, not a shrunken sidebar)

A five-item bottom bar covers daily use, and every remaining web view is one tap
away — so reducing the eleven-item sidebar loses **no** functionality:

| Bottom tab | Screen |
|---|---|
| Dashboard | balance, local reference, quick actions, recent activity, status |
| My Wallet | balance, wallet identity, send/receive/fund, history |
| BRIX Card | card, issuance fee, transaction fee, freeze, card-to-card entry |
| My Transactions | filterable cards, received/sent totals, detail view |
| More | Card-to-Card, Merchant, Fund BRIX, Send, Receive, Pay, Notifications, Account |

Modals/cards: `send`, `receive`, `pay`, `scan`, `card-to-card`, `funding`,
`merchant`, `notifications`, `receipt`, `transaction/[id]`.

---

## 4. Quick start

```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_BRIX_API_BASE_URL if needed
npm start                     # then press "a" (Android) / "i" (iOS)
npm run typecheck             # tsc --noEmit
npm run doctor                # expo-doctor
```

Builds are produced with EAS — see **[docs/BUILD.md](docs/BUILD.md)**.

```bash
npm run build:apk   # Android APK  (internal distribution)
npm run build:aab   # Android AAB  (Play Store)
npm run build:ipa   # iOS IPA      (App Store)
```

---

## 5. What is deliberately NOT implemented

Documented rather than faked, because the existing system provides no evidence
for them:

* No public-blockchain / token features. The portal states "internal ledger";
  `funding-config.php` contains no chain RPC, contract address or token symbol.
  The phrase "BRIX Token" appears nowhere in this project.
* No Visa/Mastercard PAN · CVV · expiry. The backend exposes a **masked** card
  identifier only (`#cardNumberMasked`); the mobile card renders that.
* No live bank or fiat-processor integration. PRE-APPROVAL mode is preserved.
* No automated on-chain USDC watcher. Funding is a **proof-upload review flow**
  (`#fundingProof` / `#fundingProofStatus`), which is what Fund BRIX implements.
* No remote push registration. The backend documents no registration endpoint,
  so the app ships the permission handling, event taxonomy and a persisted local
  inbox behind a `REMOTE_PUSH_SUPPORTED = false` capability flag.

---

## 6. Security posture

* Tokens in **expo-secure-store** (iOS Keychain / Android Keystore), never plain
  AsyncStorage; cookie session preserved by the platform cookie jar via
  `credentials: 'include'`.
* HTTPS enforced — the client refuses a non-HTTPS origin unless
  `EXPO_PUBLIC_BRIX_ALLOW_CLEARTEXT=true` is explicitly set for local debugging.
* Any `401` anywhere broadcasts a session-expired event that redirects to sign-in.
* Every state-changing financial call carries an `Idempotency-Key`; combined with
  a disabled-button + ref latch, a double tap cannot double-send.
* No API secrets, keys or credentials exist in the app — it is a pure client.
* Optional biometric unlock gates local access to an already-established session.
