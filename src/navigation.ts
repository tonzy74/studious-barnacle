export type RootStackParamList = {
  Tabs: undefined;
  AddBottle: {
    barcode?: string;
    name?: string;
    brand?: string;
    refId?: string;
    imageUrl?: string;
  };
  BottleDetail: { id: string };
  BulkAdd: undefined;
  Settings: undefined;
  Releases: undefined;
};

export type TabParamList = {
  Bar: undefined;
  Scan: undefined;
  Pour: undefined;
  Pair: undefined;
  Match: undefined;
  Trade: undefined;
};
