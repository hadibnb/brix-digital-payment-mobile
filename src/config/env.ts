import Constants from 'expo-constants';

type BrixExtra = {
  brix?: {
    apiBaseUrl?: string;
    apiGatewayPath?: string;
    webOrigin?: string;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as BrixExtra;

function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return fallback;
}

/** Origin of the existing BRIX backend. The app is a client of this server. */
export const API_BASE_URL: string = readEnv(
  'EXPO_PUBLIC_BRIX_API_BASE_URL',
  extra.brix?.apiBaseUrl ?? 'https://dp.brixgroup.ir',
).replace(/\/+$/, '');

/** Central gateway script — every routed business call goes through this file. */
export const API_GATEWAY_PATH: string = readEnv(
  'EXPO_PUBLIC_BRIX_API_GATEWAY',
  extra.brix?.apiGatewayPath ?? '/api.php',
);

/** Origin used to build QR payloads, mirroring `BRIX_QR_BASE` on the web client. */
export const WEB_ORIGIN: string = extra.brix?.webOrigin ?? API_BASE_URL;

/** Currency preselected before the local reference context resolves. */
export const DEFAULT_CURRENCY: string = readEnv(
  'EXPO_PUBLIC_BRIX_DEFAULT_CURRENCY',
  'AED',
);

/** UI language preselected before the local context resolves. */
export const DEFAULT_LANGUAGE: string = readEnv(
  'EXPO_PUBLIC_BRIX_DEFAULT_LANGUAGE',
  'en',
);

/**
 * Cleartext HTTP is forbidden unless explicitly enabled for local debugging.
 * Release builds must keep this false; the client refuses to talk to a
 * non-HTTPS origin otherwise.
 */
export const ALLOW_CLEARTEXT: boolean =
  readEnv('EXPO_PUBLIC_BRIX_ALLOW_CLEARTEXT', 'false') === 'true';

/** External QR renderer the web client uses (`api.qrserver.com`). */
export const QR_RENDER_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

export const REQUEST_TIMEOUT_MS = 20_000;
