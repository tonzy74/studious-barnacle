/** Signed-in identity (Sign in with Apple today; Google when backend lands). */
export interface UserProfile {
  provider: 'apple' | 'google';
  userId: string;
  name?: string;
  email?: string;
  signedInAt: number;
}

/**
 * Privacy consent state. Everything defaults to OFF (opt-in model) — the
 * strictest common denominator across GDPR (consent required) and CCPA
 * (opt-out required), and the only default that never needs geo-detection.
 */
export interface ConsentSettings {
  /** Anonymized product-improvement analytics. */
  analytics: boolean;
  /**
   * Sharing/sale of data to third parties. Requires the iOS App Tracking
   * Transparency prompt to have been granted — both must be true.
   */
  sellShare: boolean;
  /** When the user last made a consent choice (for audit). */
  decidedAt?: number;
}

/** A single anonymized analytics event, queued on-device. */
export interface AnalyticsEvent {
  name: string;
  /** Sanitized, non-PII properties only (enforced at record time). */
  props: Record<string, string | number | boolean>;
  /** Random per-install ID — not tied to identity. */
  anonId: string;
  at: number;
}

export type WhiskeyType =
  | 'bourbon'
  | 'rye'
  | 'tennessee'
  | 'scotch'
  | 'irish'
  | 'japanese'
  | 'canadian'
  | 'other';

/**
 * Flavor intensities on a 0-10 scale, aggregated from professional
 * tasting-note language (Whisky Advocate, Breaking Bourbon, Distiller, etc.).
 */
export interface FlavorProfile {
  sweet: number;
  oak: number;
  vanilla: number;
  caramel: number;
  spice: number;
  fruit: number;
  floral: number;
  smoke: number;
  nutty: number;
  earthy: number;
}

export interface WhiskeyRecord {
  id: string;
  name: string;
  distillery: string;
  type: WhiskeyType;
  proof: number;
  flavor: FlavorProfile;
  /** Condensed aggregate of professional tasting notes. */
  notes: string;
  /** Known UPC/EAN barcodes for this bottling, when available. */
  barcodes?: string[];
  rarity?: Rarity;
  /** Estimated retail price (MSRP), USD. */
  msrp?: number;
  /** Estimated secondary-market price, USD. */
  secondary?: number;
  /** True for records learned at runtime (scans, AI profiling, manual adds). */
  learned?: boolean;
}

/** Where a bottle's flavor profile came from. */
export type FlavorSource = 'db' | 'ai' | 'default' | 'user';

/**
 * Gaming-style rarity tier based on allocation and overall scarcity.
 * S = unicorns (Pappy, BTAC), A = allocated, B = semi-allocated / limited,
 * C = shelf availability, D = bottom-shelf everywhere.
 */
export type Rarity = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Bottle {
  id: string;
  name: string;
  distillery: string;
  type: WhiskeyType;
  proof: number;
  barcode?: string;
  /** Matched record from the reference database, if identified. */
  refId?: string;
  flavor: FlavorProfile;
  flavorSource?: FlavorSource;
  notes: string;
  /** Batch code for batch-released expressions (e.g. "C923", "2023-02"). */
  batch?: string;
  /** Store/club pick name (e.g. "Total Wine", "Lincoln Road pick"). */
  pickName?: string;
  /** Single-barrel number, when known. */
  barrelNo?: string;
  rarity?: Rarity;
  /** Estimated retail price (MSRP), USD. */
  msrp?: number;
  /** Estimated secondary-market price, USD. */
  secondary?: number;
  /** What the owner actually paid, USD (cost basis — display only). */
  pricePaid?: number;
  opened: boolean;
  quantity: number;
  addedAt: number;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

export interface MatchResult {
  bottle: Bottle;
  /** 0-100 similarity to the friend's favorite-whiskey profile. */
  percent: number;
}
