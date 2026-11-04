import { headers } from "next/headers";
import { InventoryScreen } from "./InventoryScreen";
import type { Item, Vendor } from "./item/types";

export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [itemRes, formRes, vendorRes] = await Promise.all([
    fetch(`${api}/staff/items`, { headers: { cookie }, cache: "no-store" }),
    fetch(`${api}/item-forms`, { cache: "no-store" }),
    fetch(`${api}/vendors`, { headers: { cookie }, cache: "no-store" }),
  ]);
  if (!itemRes.ok) throw new Error(`staff/items answered ${itemRes.status}`);
  const items: Item[] = await itemRes.json();
  const forms: string[] = await formRes.json();
  const vendors: Vendor[] = vendorRes.ok ? await vendorRes.json() : [];
  return <InventoryScreen items={items} forms={forms} vendors={vendors} />;
}
