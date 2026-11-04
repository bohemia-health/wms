import { headers } from "next/headers";
import { OrdersScreen } from "./OrdersScreen";
import type { Courier, OrderRow } from "./types";

export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [res, courierRes] = await Promise.all([
    fetch(`${api}/staff/orders`, { headers: { cookie }, cache: "no-store" }),
    fetch(`${api}/couriers`, { headers: { cookie }, cache: "no-store" }),
  ]);
  if (!res.ok) throw new Error(`staff/orders answered ${res.status}`);
  const orders: OrderRow[] = await res.json();
  const couriers: Courier[] = courierRes.ok ? await courierRes.json() : [];
  return <OrdersScreen orders={orders} couriers={couriers} />;
}
