"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { CampaignStatus } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Forward the browser's cookie so the API can check the staff role.
async function staffFetch(path: string, init: RequestInit) {
  const cookie = (await headers()).get("cookie") ?? "";
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { cookie, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

// Errors come back as values so the form can print them; on success the
// campaign screens are marked stale and re-fetch on the next render.
async function finish(res: Response, fallback: string): Promise<ActionResult> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `${fallback} (${res.status})` };
  }
  revalidatePath("/campaigns", "layout");
  return { ok: true };
}

export async function createCampaign(formData: FormData) {
  return finish(
    await staffFetch("/campaigns", {
      method: "POST",
      body: JSON.stringify({ title: formData.get("title") }),
    }),
    "Create failed",
  );
}

export async function setCampaignStatus(id: string, status: CampaignStatus) {
  return finish(
    await staffFetch(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    "Status change failed",
  );
}

export async function addCampaignItem(campaignId: string, formData: FormData) {
  const moq = String(formData.get("moq") ?? "").trim();
  const moqPrice = String(formData.get("moqPrice") ?? "").trim();
  return finish(
    await staffFetch(`/campaigns/${campaignId}/items`, {
      method: "POST",
      body: JSON.stringify({
        code: formData.get("code"),
        name: formData.get("name"),
        size: formData.get("size"),
        form: formData.get("form"),
        price: formData.get("price"),
        // Blank means "not decided yet", which the API stores as null.
        moq: moq ? Number(moq) : undefined,
        moqPrice: moqPrice || undefined,
      }),
    }),
    "Add failed",
  );
}
