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

// One batch of stock for an item, as GET /staff/items returns it.
export type Batch = {
  id: number;
  vendorId: number;
  vendor: string;
  vendorShort: string | null;
  batchNumber: string;
  quantity: number | null;
  labReports: number;
};

// One row of the inventory list, as GET /staff/items returns it: the store
// fields, the cost and listing the store never sees, and the batches.
export type Item = {
  id: string;
  name: string;
  size: string | null;
  form: string | null;
  price: string;
  unitPrice: string;
  listed: boolean;
  slug: string | null;
  batches: Batch[];
};
