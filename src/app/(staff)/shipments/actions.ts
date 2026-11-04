"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ShipmentInput } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function staffFetch(path: string, init: RequestInit) {
  const cookie = (await headers()).get("cookie") ?? "";
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { cookie, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

async function finish(res: Response, fallback: string): Promise<ActionResult> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `${fallback} (${res.status})` };
  }
  revalidatePath("/shipments");
  revalidatePath("/orders");
  return { ok: true };
}

export async function createShipment(input: ShipmentInput) {
  return finish(
    await staffFetch("/shipments", { method: "POST", body: JSON.stringify(input) }),
    "Create failed",
  );
}

export async function updateShipment(id: string, input: ShipmentInput) {
  return finish(
    await staffFetch(`/shipments/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    "Save failed",
  );
}

export async function deleteShipment(id: string) {
  return finish(await staffFetch(`/shipments/${id}`, { method: "DELETE" }), "Delete failed");
}

export type OrderMatch =
  | { ok: true; id: string; orderNumber: string; customer: string }
  | { ok: false; error: string };

// Resolve a typed order number to the order it names, with enough to show
// the admin they have the right one.
export async function lookupOrder(number: string): Promise<OrderMatch> {
  const clean = number.trim().toUpperCase();
  if (!clean) return { ok: false, error: "Enter an order number" };
  const res = await staffFetch(`/staff/orders/${encodeURIComponent(clean)}`, {});
  if (res.status === 404) return { ok: false, error: "No order with that number" };
  if (!res.ok) return { ok: false, error: `Lookup failed (${res.status})` };
  const o = (await res.json()) as {
    id: string;
    orderNumber: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  const customer = [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || "Guest";
  return { ok: true, id: o.id, orderNumber: o.orderNumber, customer };
}

export async function refreshTracking(
  id: string,
): Promise<{ ok: true; status: string; events: number } | { ok: false; error: string }> {
  const res = await staffFetch(`/shipments/${id}/refresh`, { method: "POST" });
  const body = (await res.json().catch(() => null)) as
    | { status?: string; events?: number; error?: string }
    | null;
  if (!res.ok) return { ok: false, error: body?.error ?? `Refresh failed (${res.status})` };
  revalidatePath("/shipments");
  revalidatePath("/orders");
  return { ok: true, status: body?.status ?? "", events: body?.events ?? 0 };
}
