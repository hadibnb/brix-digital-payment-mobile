/**
 * Brand tokens extracted from the live web client stylesheet
 * (`assets/app.css?v=4318`) so the mobile app keeps the existing visual
 * identity instead of introducing a new design language.
 *
 *   --navy:#071321  --panel:#0c1d2e  --line:#1b3045  --text:#edf2f7
 *   --muted:#91a0af --gold:#caa65a   --ok:#67c69b    --danger:#d86b6b
 *   theme-color:#0b1220  background:#08101d
 */

export const colors = {
  // Backgrounds
  base: '#08101d',
  navy: '#071321',
  surface: '#0c1d2e',
  surfaceAlt: '#102438',
  surfaceRaised: '#132a40',
  theme: '#0b1220',

  // Lines / borders
  line: '#1b3045',
  lineStrong: '#223a50',

  // Content
  text: '#edf2f7',
  textSecondary: '#c8d1da',
  textMuted: '#91a0af',
  textFaint: '#6b7c8c',

  // Brand accents
  gold: '#caa65a',
  goldDeep: '#80683a',
  goldSoft: '#d8b96e',

  // Semantic
  success: '#67c69b',
  danger: '#d86b6b',
  dangerSoft: '#ef9a9a',
  warning: '#e0b566',
  info: '#7fb2d9',

  // Utility
  overlay: 'rgba(4,9,16,0.72)',
  transparent: 'transparent',
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6 },
  mono: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.4 },
} as const;

export const layout = {
  /** Minimum comfortable touch target (iOS HIG / Material). */
  touchTarget: 48,
  screenPadding: spacing.lg,
  tabBarHeight: 62,
  maxContentWidth: 640,
} as const;

/** Shadow presets — subtle, financial-grade rather than playful. */
export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
