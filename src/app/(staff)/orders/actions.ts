"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { OrderDetail, OrderStatus } from "./types";

async function staffFetch(path: string, init: RequestInit = {}) {
  const cookie = (await headers()).get("cookie") ?? "";
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { cookie, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

export async function getOrder(
  number: string,
): Promise<{ ok: true; order: OrderDetail } | { ok: false; error: string }> {
  const res = await staffFetch(`/staff/orders/${encodeURIComponent(number)}`);
  if (!res.ok) return { ok: false, error: `Could not load order (${res.status})` };
  return { ok: true, order: await res.json() };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await staffFetch(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `Update failed (${res.status})` };
  }
  revalidatePath("/orders");
  return { ok: true };
}

export async function updateOrdersStatus(
  ids: string[],
  status: OrderStatus,
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const res = await staffFetch("/orders/status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status }),
  });
  const body = (await res.json().catch(() => null)) as
    | { updated?: number; error?: string }
    | null;
  if (!res.ok) return { ok: false, error: body?.error ?? `Update failed (${res.status})` };
  revalidatePath("/orders");
  return { ok: true, updated: body?.updated ?? ids.length };
}

// Tracking typed on the order becomes an outbound shipment linked to it,
// shipped now, in transit. Marking the order SHIPPED is the usual next
// step, so it rides along unless the admin unticks it.
export async function addTracking(
  orderId: string,
  input: { courierId: string; trackingNumber: string; markShipped: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trackingNumber = input.trackingNumber.trim();
  if (!input.courierId) return { ok: false, error: "Pick a courier" };
  if (!trackingNumber) return { ok: false, error: "Enter the tracking number" };

  const created = await staffFetch("/shipments", {
    method: "POST",
    body: JSON.stringify({
      courierId: input.courierId,
      direction: "OUTBOUND",
      status: "IN_TRANSIT",
      trackingNumber,
      shippedAt: new Date().toISOString(),
      orderId,
    }),
  });
  if (!created.ok) {
    const body = (await created.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `Could not create shipment (${created.status})` };
  }
  if (input.markShipped) {
    const moved = await staffFetch(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "SHIPPED" }),
    });
    if (!moved.ok) {
      revalidatePath("/orders");
      revalidatePath("/shipments");
      return { ok: false, error: `Shipment saved, but the order could not be marked shipped (${moved.status})` };
    }
  }
  revalidatePath("/orders");
  revalidatePath("/shipments");
  return { ok: true };
}
