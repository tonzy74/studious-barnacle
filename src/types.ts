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
