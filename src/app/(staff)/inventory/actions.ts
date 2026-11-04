"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Both actions forward the browser's cookie so the API can check the staff
// role, then revalidate the list so the table shows the change on return.
// Errors come back as values, not throws, so the row can show them inline.
async function staffFetch(path: string, init: RequestInit) {
  const cookie = (await headers()).get("cookie") ?? "";
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { cookie, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

async function explain(res: Response, fallback: string) {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? `${fallback} (${res.status})`;
}

export async function updateItem(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const res = await staffFetch(`/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: formData.get("name"),
      size: formData.get("size"),
      form: formData.get("form"),
      price: formData.get("price"),
      unitPrice: formData.get("unitPrice"),
      listed: formData.get("listed") === "true",
    }),
  });
  if (!res.ok) return { ok: false, error: await explain(res, "Update failed") };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const res = await staffFetch(`/items/${id}`, { method: "DELETE" });
  if (!res.ok) return { ok: false, error: await explain(res, "Delete failed") };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function addBatch(
  itemId: string,
  formData: FormData,
): Promise<ActionResult> {
  const res = await staffFetch(`/items/${itemId}/batches`, {
    method: "POST",
    body: JSON.stringify(batchBody(formData)),
  });
  if (!res.ok) return { ok: false, error: await explain(res, "Add failed") };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function updateBatch(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const res = await staffFetch(`/batches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(batchBody(formData)),
  });
  if (!res.ok) return { ok: false, error: await explain(res, "Save failed") };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function deleteBatch(id: number): Promise<ActionResult> {
  const res = await staffFetch(`/batches/${id}`, { method: "DELETE" });
  if (!res.ok) return { ok: false, error: await explain(res, "Remove failed") };
  revalidatePath("/inventory");
  return { ok: true };
}

function batchBody(formData: FormData) {
  return {
    vendorId: Number(formData.get("vendorId")),
    batchNumber: String(formData.get("batchNumber") ?? ""),
    quantity: Number(formData.get("quantity")),
  };
}
