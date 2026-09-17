# Flow test checklist

All 25 requested flows are implemented as real behaviour. This is the manual QA
script to run against the live backend.

**Honest scope note:** the flows below could not be executed end-to-end inside
this environment — an Expo app needs a device/simulator, and the authenticated
BRIX routes require live credentials, which were deliberately never used. Static
checks that *were* run and pass: `npx tsc --noEmit` (strict) and `npx expo-doctor`
(18/18 checks). Flows marked ⚠️ depend on gateway routes the backend does not
document publicly (see `docs/API_MAP.md`) and must be confirmed against the real
server.

| # | Flow | How to test | Expected |
|---|---|---|---|
| 1 | App launch | Cold start | Splash → i18n + session hydrate → sign-in or dashboard; no blank frame |
| 2 | Login | `#loginForm` equivalent: identifier + password | Session stored; dashboard loads |
| 3 | Logout | Account → Sign out → confirm | Session cleared from SecureStore; back at sign-in ⚠️ |
| 4 | Registration | Register → submit | Account created; navigates to verify |
| 5 | Forgot password | Forgot → email → code + new password | `/password-reset.php` action `request` then `reset` |
| 6 | Session expiration | Force a 401 (expire token server-side) | Auto-redirect to sign-in with the reason |
| 7 | Dashboard loading | Open tab | Balance first, then local reference; skeleton while loading |
| 8 | Wallet | Open tab | Balance, wallet id, account number, updated-at, history |
| 9 | Send | Send → resolve → confirm | Confirmation sheet; success only after backend confirms |
| 10 | Receive | Open screen | QR from `api.qrserver.com`; copy + share work |
| 11 | Pay | Pay → apply code → amount → confirm | Payee shown before any debit; success from backend |
| 12 | QR scan | Scan → grant camera → point at QR | Code extracted (`brix:`, URL `?code=`, or raw) and resolved |
| 13 | Fund BRIX | Fund → method → amount → attach proof → submit | USDC wallet/Sheba from `funding-config.php`; receipt says *pending review* |
| 14 | Transactions | Open tab | Cards with type/amount/date/status/reference/fee; filters work |
| 15 | BRIX Card | Open tab | Masked identifier only; fees from `card-issuance-quote.php`; issue/freeze confirm |
| 16 | Card-to-Card | Enter recipient card + amount → confirm | `card-to-card.php`; "Recipient card could not be verified" shown verbatim |
| 17 | Merchant | List / create / pay | Status from backend; no local approval |
| 18 | Account | Open screen | Profile, verification badges, biometric toggle, about |
| 19 | Language selection | Pick fa or ar | UI switches instantly; RTL applied (Android may need a reload) |
| 20 | Currency selection | Pick OMR/CNY/AED | Rates refetch for the new currency; region never overwrites an explicit choice |
| 21 | Network failure | Enable airplane mode, pull to refresh | Offline banner + typed network error + retry |
| 22 | API failure | Return 500 from the backend | Server error surfaced; retry offered |
| 23 | Invalid session | Corrupt/expire the token | Same path as #6 |
| 24 | Android back | Hardware back on each screen | Pops the router stack; modals dismiss; exit only at root |
| 25 | iOS navigation | Edge swipe-back + sheet dismiss | Native gesture behaviour throughout |

## Duplicate-submission checks (financial safety)

| Scenario | Expected |
|---|---|
| Double-tap "Confirm transfer" | One request only — button disabled while in flight, ref latch rejects the second call |
| Retry after a dropped connection | Backend deduplicates on the identical `Idempotency-Key` |
| Back out of the confirm sheet mid-flight | Sheet refuses to dismiss while `loading` |

## Verification commands

```bash
npx tsc --noEmit      # strict TypeScript — must be clean
npx expo-doctor       # must be 18/18
npm start             # then run flows 1–25 on a device/simulator
npx expo start --tunnel   # if the LAN cannot reach the dev server
```
