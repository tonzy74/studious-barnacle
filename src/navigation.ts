export type RootStackParamList = {
  Tabs: undefined;
  AddBottle: {
    barcode?: string;
    name?: string;
    brand?: string;
    refId?: string;
    imageUrl?: string;
    opened?: boolean;
  };
  BottleDetail: { id: string };
  BulkAdd: undefined;
  Settings: undefined;
  Releases: undefined;
  Explore: undefined;
  Journal: undefined;
  Wishlist: undefined;
  Recommend: undefined;
  Portfolio: undefined;
  Achievements: undefined;
  ScanLabel: { barcode?: string } | undefined;
  Paywall: undefined;
  Diagnostics: undefined;
  Insights: undefined;
  Trade: undefined;
  Pour: undefined;
  Match: undefined;
  LogPour: { bottleId?: string; name?: string; distillery?: string; type?: string };
};

export type TabParamList = {
  Home: undefined;
  Bar: undefined;
  Scan: undefined;
  Pair: undefined;
  Explore: undefined;
};
