export const SHIPMENT_STATUSES = [
  "PRE_FILED",
  "IN_TRANSIT",
  "AWAITING_CLEARANCE",
  "IN_INSPECTION",
  "PGA_HOLD",
  "DUTY_PENDING",
  "CLEARED",
  "RELEASED_TO_CARRIER",
  "REJECTED",
  "RETURNED",
  "DELAYED",
  "STATUS_UNKNOWN",
  "DELIVERED",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const VERIFICATIONS = [
  "PENDING VERIFICATION",
  "VERIFIED",
  "DISCREPANCY_SHORTAGE",
  "DISCREPANCY_OVERAGE",
  "DAMAGED",
] as const;
export type Verification = (typeof VERIFICATIONS)[number];

export type Direction = "INBOUND" | "OUTBOUND";
export type Allocation = "campaign" | "store";

export type ShipmentLine = {
  itemId: string;
  name: string;
  size: string | null;
  allocation: Allocation;
  quantity: number;
};

// One row of GET /staff/shipments.
export type Shipment = {
  id: string;
  courierId: string;
  courier: string;
  courierShort: string | null;
  trackingNumber: string | null;
  direction: Direction;
  status: ShipmentStatus;
  verificationStatus: Verification | null;
  shippedAt: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
  currentLocation: string | null;
  // Last time the carrier feed wrote the status, location and dates.
  trackedAt: string | null;
  orderId: string | null;
  orderNumber: string | null;
  labId: string | null;
  lab: string | null;
  campaignId: string | null;
  campaign: string | null;
  items: ShipmentLine[];
};

// What the form sends: the API body, dates already in ISO.
export type ShipmentInput = {
  courierId: string;
  direction: Direction;
  trackingNumber: string | null;
  status: ShipmentStatus;
  verificationStatus: Verification | null;
  shippedAt: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
  currentLocation: string | null;
  orderId: string | null;
  labId: string | null;
  campaignId: string | null;
  items: { itemId: string; allocation: Allocation; quantity: number }[];
};

export type Courier = { id: string; name: string; shortName: string | null; trackingCode: string | null };
export type Pick = { id: string; label: string };
export type ItemPick = { id: string; name: string; size: string | null };

// Statuses that mean a person has to look.
export const ATTENTION = new Set<ShipmentStatus>([
  "AWAITING_CLEARANCE",
  "IN_INSPECTION",
  "PGA_HOLD",
  "DUTY_PENDING",
  "DELAYED",
  "REJECTED",
  "RETURNED",
  "STATUS_UNKNOWN",
]);
