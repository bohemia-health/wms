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
  // A UPC-A number the database makes from the batch id ("300001001038":
  // a leading 3, the id, a check digit); what the vial label encodes and
  // what a scan returns. Null only for a row the API has not migrated yet.
  barcode: string | null;
  quantity: number | null;
  labReports: number;
};

// One image of an item. The first in the list is the one the store shows.
export type ItemImage = {
  id: string;
  url: string;
  alt: string | null;
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
  // "campaign" items belong to one group buy and carry its MOQ terms;
  // "store" items have none of the three fields below.
  channel: "store" | "campaign";
  campaignId: string | null;
  moq: number | null;
  moqPrice: string | null;
  // On hand is the sum of the batches; reserved is what unshipped orders
  // have claimed; available = onHand - reserved and is what can be sold.
  onHand: number;
  reserved: number;
  available: number;
  batches: Batch[];
  images: ItemImage[];
};
