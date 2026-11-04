import { headers } from "next/headers";
import { ShipmentsScreen } from "./ShipmentsScreen";
import type { Courier, ItemPick, Pick, Shipment } from "./types";

export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const get = (path: string) =>
    fetch(`${api}${path}`, { headers: { cookie }, cache: "no-store" });
  const [shipRes, courierRes, labRes, campaignRes, itemRes] =
    await Promise.all([
      get("/staff/shipments"),
      get("/couriers"),
      get("/labs"),
      get("/staff/campaigns"),
      get("/staff/items"),
    ]);
  if (!shipRes.ok) throw new Error(`staff/shipments answered ${shipRes.status}`);
  const shipments: Shipment[] = await shipRes.json();
  const couriers: Courier[] = courierRes.ok ? await courierRes.json() : [];
  const labs: Pick[] = labRes.ok
    ? ((await labRes.json()) as { id: string; name: string | null }[]).map((l) => ({
        id: l.id,
        label: l.name ?? l.id,
      }))
    : [];
  const campaigns: Pick[] = campaignRes.ok
    ? ((await campaignRes.json()) as { id: string; title: string }[]).map((c) => ({
        id: c.id,
        label: c.title,
      }))
    : [];
  const items: ItemPick[] = itemRes.ok
    ? ((await itemRes.json()) as ItemPick[]).map(({ id, name, size }) => ({ id, name, size }))
    : [];

  return (
    <ShipmentsScreen
      shipments={shipments}
      couriers={couriers}
      labs={labs}
      campaigns={campaigns}
      items={items}
    />
  );
}
