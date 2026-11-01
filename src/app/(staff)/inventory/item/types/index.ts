type NewItem = {
  itemCodeId: string;
  name: string;
  size: string | null;
  form: string | null;
  vendorId: number;
  isDisclosed: boolean;
  quantity: number;
  price: string;
  slug: string | null;
  batchNumber?: string;
};

export type ItemCode = {
  id: string;
  code: string;
  title: string;
};

export type Vendor = {
  publicId: number;
  name: string;
  shortName: string | null;
};
