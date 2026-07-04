/**
 * Whiskey Vault design system.
 *
 * The palette is built to feel like aged oak, brass, and candlelight —
 * deep browns, warm cream, and a gold accent that reads as luxury rather
 * than "default dark app." Everything (spacing, radii, type, shadow) is a
 * token so screens stay consistent and easy to restyle.
 */

export const colors = {
  // Backgrounds — layered browns, darkest at the base.
  bg: '#140d07',
  bgElevated: '#1c130b',
  card: '#241811',
  cardAlt: '#2f2015',
  cardGlow: '#3a2817',
  border: '#4a3520',
  borderBright: '#6b4e2e',

  // Brass / gold accent family.
  amber: '#d99a3d',
  amberBright: '#f0b45c',
  amberDeep: '#a6702a',
  gold: '#e8c179',

  // Text.
  text: '#f5ecdf',
  textDim: '#b39d82',
  textFaint: '#7d6b54',

  // Status.
  danger: '#c0563f',
  success: '#8bb36a',

  // Fixed dark ink for text on gold surfaces.
  ink: '#1a120b',
};

/** Multi-stop gradients for hero surfaces, buttons, and badges. */
export const gradients = {
  screen: ['#1c130b', '#140d07'] as const,
  card: ['#2b1d12', '#221610'] as const,
  gold: ['#f0b45c', '#d99a3d', '#a6702a'] as const,
  hero: ['#3a2817', '#241811', '#140d07'] as const,
  ember: ['#a6702a', '#5e3d18'] as const,
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

/** Type scale — sizes and weights used across screens. */
export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: 0.3 },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: 0.2 },
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  gold: {
    shadowColor: '#d99a3d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
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
