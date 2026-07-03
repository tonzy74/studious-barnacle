export type RootStackParamList = {
  Tabs: undefined;
  AddBottle: {
    barcode?: string;
    name?: string;
    brand?: string;
    refId?: string;
  };
  BottleDetail: { id: string };
  Settings: undefined;
};

export type TabParamList = {
  Bar: undefined;
  Scan: undefined;
  Pour: undefined;
  Pair: undefined;
  Match: undefined;
};
