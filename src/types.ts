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
   * IMPORTANT: any future flush/share implementation must re-check
   * getTrackingPermissionsAsync() at send time — the user can revoke
   * tracking in iOS Settings without this flag updating.
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
  /**
   * Reference bottle image URL (https). Sourced from licensed channels only —
   * Open Food Facts product photos, the affiliate/pricing backend's feed
   * images, or a user's own photo. Never scraped from distiller sites.
   */
  imageUrl?: string;
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
  /** Reference/owner photo (https or local file URI). */
  imageUrl?: string;
  opened: boolean;
  /** Remaining fill as a percent (0-100). Undefined = not tracked. */
  fillLevel?: number;
  /** An ever-topped-up "infinity"/solera bottle. */
  infinity?: boolean;
  quantity: number;
  addedAt: number;
}

/** A single logged pour in the tasting journal. */
export interface Pour {
  id: string;
  /** Linked collection bottle, when the pour came from an owned bottle. */
  bottleId?: string;
  name: string;
  distillery?: string;
  /** Personal score, 0-100. */
  rating?: number;
  notes?: string;
  /** Photo of the pour (local uri or https). */
  imageUrl?: string;
  at: number;
}

/** A bottle the user is hunting for. */
export interface WishlistItem {
  id: string;
  name: string;
  distillery?: string;
  note?: string;
  /** Alert when a retailer offer drops to/below this price (needs backend). */
  targetPrice?: number;
  /** Watch for this as an upcoming release. */
  watchRelease?: boolean;
  addedAt: number;
}

/** A point-in-time snapshot of total collection value for the trend chart. */
export interface ValueSnapshot {
  at: number;
  value: number;
  bottles: number;
}

/**
 * A market comp: an observed value for a bottling from a completed trade or
 * sale. Aggregated over time (time-decayed) into real secondary-market values
 * — the compliant equivalent of a "blue book" grown from actual activity.
 */
export interface Comp {
  id: string;
  /** Bottling name (matched normalized). */
  name: string;
  value: number;
  at: number;
  source: 'trade' | 'sale' | 'backend';
}

/**
 * A user correction of an AI identification. When the AI reads a bottle one
 * way and the user fixes it, we remember the mapping so the same misread is
 * auto-corrected next time — the app self-improves from its own mistakes.
 */
export interface Correction {
  /** Normalized key of what the AI originally said (name + distillery). */
  from: string;
  /** The corrected identity. */
  name: string;
  distillery: string;
  type: WhiskeyType;
  proof?: number;
  /** How many times this correction has been applied/confirmed. */
  count: number;
  at: number;
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
