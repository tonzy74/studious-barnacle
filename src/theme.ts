/**
 * Whiskey Vault design system.
 *
 * The palette is a candlelit whiskey lounge — aged oak and mahogany, worn
 * leather, and warm brass, lit low and gold. Everything (spacing, radii,
 * type, shadow, texture) is a token so screens stay consistent.
 */

import { Platform } from 'react-native';

export const colors = {
  // Backgrounds — warm mahogany/oak, darkest at the base.
  bg: '#160d06',
  bgElevated: '#20140a',
  card: '#2a1a0f',
  cardAlt: '#382312',
  cardGlow: '#442b16',
  border: '#553a1f',
  borderBright: '#82592c',

  // Brass / gold accent family.
  amber: '#dc9c3c',
  amberBright: '#f4b95e',
  amberDeep: '#a86c26',
  gold: '#ecc47e',
  brass: '#c8973f',

  // Text.
  text: '#f6ecdd',
  textDim: '#b8a084',
  textFaint: '#846c50',

  // Status.
  danger: '#c85942',
  success: '#93b96e',

  // Fixed dark ink for text on gold surfaces.
  ink: '#1a1108',
};

/** Multi-stop gradients for hero surfaces, buttons, and badges. */
export const gradients = {
  // Deeper 3-stop base so the screen reads as a lit lounge, not a flat panel.
  screen: ['#2a1c0f', '#170f07', '#0e0803'] as const,
  card: ['#3a2614aa', '#2d1d10', '#20140b'] as const,
  gold: ['#f7c882', '#dc9c3c', '#9e6522'] as const,
  hero: ['#4d3419', '#2c1c0f', '#160d06'] as const,
  ember: ['#a86c26', '#5f3c16'] as const,
};

/** Warm radial glow laid over the screen background for depth. */
export const glow = {
  color: '#ecab46',
  topOpacity: 0.17,
};

/** Serif display family — a refined, lounge-menu feel for big titles. */
export const fonts = {
  serif: Platform.select({ ios: 'Baskerville', android: 'serif', default: 'serif' }),
};

/** Consistent spacing scale (4pt base). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/** Corner radii. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

/** Type scale — serif display for refined titles, sans for everything else. */
export const type = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: 0.3, fontFamily: fonts.serif },
  title: { fontSize: 23, fontWeight: '700' as const, letterSpacing: 0.2, fontFamily: fonts.serif },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: '500' as const },
  // Small-caps-style overline for section headers.
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
};

/** Soft warm shadow for elevated cards (iOS) — pair with elevation on Android. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 9,
  },
  gold: {
    shadowColor: '#d99a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 7,
  },
};

export const typeColors: Record<string, string> = {
  bourbon: '#d99a3d',
  rye: '#c0704a',
  tennessee: '#b8863b',
  scotch: '#8a6f4d',
  irish: '#7da35c',
  japanese: '#a486b0',
  canadian: '#87a0b8',
  other: '#9a8b7a',
};

/** Rarity tier accent colors — gem-like, S is the "unicorn" gold. */
export const rarityColors: Record<string, string> = {
  S: '#f0b45c',
  A: '#c9a5e0',
  B: '#8fb8e0',
  C: '#8bb36a',
  D: '#9a8b7a',
};

/** Icon glyph (Ionicons name) per whiskey type, for cards and chips. */
export const typeIcons: Record<string, string> = {
  bourbon: 'flame',
  rye: 'leaf',
  tennessee: 'flame',
  scotch: 'earth',
  irish: 'sparkles',
  japanese: 'flower',
  canadian: 'snow',
  other: 'wine',
};
