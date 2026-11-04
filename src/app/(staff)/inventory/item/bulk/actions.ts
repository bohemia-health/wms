"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { NewItemRow } from "./parse";

export type BulkResult =
  | { ok: true; created: number }
  | { ok: false; error: string; rows?: { row: number; error: string }[] };

// All or nothing on the API side, so either every row is now an item or
// none is; the result says which, with the offending rows when it is none.
export async function createItems(items: NewItemRow[]): Promise<BulkResult> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/bulk`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as
    | { created?: number; error?: string; errors?: { row: number; error: string }[] }
    | null;
  if (!res.ok) {
    return {
      ok: false,
      error: body?.error ?? `Bulk add failed (${res.status})`,
      rows: body?.errors,
    };
  }
  revalidatePath("/inventory");
  return { ok: true, created: body?.created ?? items.length };
}
