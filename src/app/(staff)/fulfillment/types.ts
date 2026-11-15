export type QueueOrder = {
  id: string;
  status: string;
  createdAt: string;
  lines: { name: string; quantity: number; fillable: boolean; short: number }[];
  fillable: "yes" | "partial" | "no";
};
