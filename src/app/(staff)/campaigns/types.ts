// The statuses the API accepts, in the order a campaign usually moves
// through them. "active" is the one the store treats as Open.
export const CAMPAIGN_STATUSES = [
  "draft",
  "upcoming",
  "active",
  "inactive",
  "funded",
  "unfunded",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// What staff read. "active" is what buyers experience as Open, so say that.
export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  active: "Open",
  inactive: "Inactive",
  funded: "Funded",
  unfunded: "Unfunded",
  cancelled: "Cancelled",
};

// Field names match what GET /campaigns answers, snake_case included.
export type Campaign = {
  id: string;
  title: string;
  created_at: string | null;
  ships_in_min: number | null;
  ships_in_max: number | null;
  status: CampaignStatus | null;
  opens_at: string | null;
  closes_at: string | null;
  is_visible: boolean | null;
};

export type CampaignItem = {
  item_id: string;
  name: string;
  size: string;
  form: string;
  price: string;
  moq: number | null;
  moq_price: string | null;
  listed: boolean;
};

export type CampaignDetail = Campaign & { items: CampaignItem[] };
