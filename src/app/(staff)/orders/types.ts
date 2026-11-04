export const ORDER_STATUSES = [
  "RECEIVED",
  "OPEN",
  "SHIPPED",
  "IN_TRANSIT",
  "DELAYED",
  "COMPLETED",
  "CANCELLED",
  "ACTION_REQUIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// One row of GET /staff/orders.
export type OrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  shipTo: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  subtotal: string | null;
  shipping: string | null;
  tax: string | null;
  total: string | null;
  createdAt: string | null;
  items: string | null;
  units: number;
  shipmentCount: number;
};

export type OrderAddress = {
  type: "shipping" | "billing";
  name: string | null;
  line1: string;
  line2: string | null;
  line3: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
};

// GET /staff/orders/:number.
export type OrderDetail = Omit<
  OrderRow,
  "shipTo" | "city" | "state" | "country" | "items" | "units" | "shipmentCount"
> & {
  addresses: OrderAddress[];
  lines: { id: string; quantity: number; name: string; price: string }[];
  shipments: {
    id: string;
    courier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    expectedAt: string | null;
  }[];
};

// Who the order is for, from the account or the checkout form.
export const customerOf = (o: {
  firstName: string | null;
  lastName: string | null;
  shipTo?: string | null;
  email: string | null;
}) =>
  [o.firstName, o.lastName].filter(Boolean).join(" ") ||
  o.shipTo ||
  o.email ||
  "Guest";

export type Courier = { id: string; name: string; shortName: string | null };
