# Building BRIX Digital Payment for Android and iOS

Prerequisites: Node ≥ 18, an Expo account, and `eas-cli`.

```bash
npm install
npm install -g eas-cli
eas login
eas init            # writes the real projectId into app.json -> extra.eas
```

`eas.json` already defines three profiles; all of them point the app at the
existing backend via `EXPO_PUBLIC_BRIX_API_BASE_URL`.

---

## Android

### APK — sideload / internal testing

```bash
eas build -p android --profile preview
# or: npm run build:apk
```

`preview` → `android.buildType: "apk"`, `distribution: "internal"`. The build
page returns a direct APK download URL; install with
`adb install brix-digital-payment.apk`.

### AAB — Google Play

```bash
eas build -p android --profile production
# or: npm run build:aab
```

`production` → `android.buildType: "app-bundle"`, `autoIncrement: true`.
Upload to Play Console (internal → closed → production), or:

```bash
eas submit -p android --profile production
```

`serviceAccountKeyPath` in `eas.json` must point at a real Play service-account
JSON. Keep it out of git (`.gitignore` already excludes `secrets/`).

### Play Console checklist

* Package: `ir.brixgroup.dp`
* Permissions declared in `app.json`: `CAMERA`, `USE_BIOMETRIC`,
  `USE_FINGERPRINT`, `VIBRATE`, `INTERNET`, `ACCESS_NETWORK_STATE`,
  `POST_NOTIFICATIONS`; `RECORD_AUDIO` explicitly blocked.
* Data safety: declare that authentication data is transmitted over TLS and
  stored in the platform keystore.
* `allowBackup: false` — financial data is not backed up off-device.

---

## iOS

```bash
eas build -p ios --profile production
# or: npm run build:ipa
```

Then, once credentials and metadata are in place:

```bash
eas submit -p ios --profile production
```

Fill in `submit.production.ios` in `eas.json` (`appleId`, `ascAppId`,
`appleTeamId`). EAS manages the distribution certificate and provisioning
profile; if you prefer local signing, add credentials with
`eas credentials -p ios`.

### Required iOS configuration (already in `app.json`)

* Bundle identifier: `ir.brixgroup.dp`
* `NSCameraUsageDescription` — scanning BRIX payment QR codes
* `NSFaceIDUsageDescription` — protecting wallet/payment access
* `NSPhotoLibraryUsageDescription` — attaching a funding proof image
* `ITSAppUsesNonExemptEncryption: false` — the app uses only standard TLS
* `NSAppTransportSecurity.NSAllowsArbitraryLoads: false` — ATS stays on

### App Store review notes

The app is an internal-ledger payment client operating in pre-approval mode.
Provide reviewers a demo account, and describe in the review notes that no
bank or fiat processor is connected and that funding requests are reviewed by
BRIX operations.

---

## Alternative: local native projects

EAS Build is the recommended path. To generate and open native projects:

```bash
npx expo prebuild --clean
cd android && ./gradlew assembleRelease     # APK
cd ios && xcodebuild -workspace *.xcworkspace -scheme brix-digital-payment archive
```

`android/` and `ios/` are git-ignored because EAS regenerates them from
`app.json`; prebuild them only when you need custom native code.

---

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_BRIX_API_BASE_URL` | Existing backend origin | `https://dp.brixgroup.ir` |
| `EXPO_PUBLIC_BRIX_API_GATEWAY` | Central gateway script | `/api.php` |
| `EXPO_PUBLIC_BRIX_DEFAULT_CURRENCY` | Currency before region resolution | `AED` |
| `EXPO_PUBLIC_BRIX_DEFAULT_LANGUAGE` | Language before device/region resolution | `en` |
| `EXPO_PUBLIC_BRIX_ALLOW_CLEARTEXT` | Allow non-TLS for local debugging only | `false` |

Release builds must keep `EXPO_PUBLIC_BRIX_ALLOW_CLEARTEXT=false`.

---

## OTA updates

`runtimeVersion.policy = "appVersion"` and an `updates` block are configured, so
JS-only fixes can ship without a new store build:

```bash
eas update --branch production --message "Fix transaction list filter"
```
