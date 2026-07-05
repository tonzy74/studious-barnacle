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
  ScanLabel: undefined;
  Paywall: undefined;
  LogPour: { bottleId?: string; name?: string; distillery?: string; type?: string };
};

export type TabParamList = {
  Bar: undefined;
  Scan: undefined;
  Pour: undefined;
  Pair: undefined;
  Match: undefined;
  Trade: undefined;
};
