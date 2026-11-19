"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { LabReport, ReportSample } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Forwards the browser's cookie so the API can check the staff role. Errors
// come back as values, not throws, so the open row can show them inline.
async function staffFetch(path: string, init: RequestInit = {}) {
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

// A blank box clears the value; the API reads null as "clear this".
const textOrNull = (value: FormDataEntryValue | null) =>
  String(value ?? "").trim() || null;

export async function updateBatch(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const batchNumber = String(formData.get("batchNumber") ?? "").trim();
  if (!batchNumber) return { ok: false, error: "Batch number is required." };

  const rawQuantity = String(formData.get("quantity") ?? "").trim();
  const quantity = rawQuantity === "" ? null : Number(rawQuantity);
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0)) {
    return { ok: false, error: "Quantity must be a whole number." };
  }

  // A blank label amount clears it; the unit goes with it.
  const rawLabel = String(formData.get("labelAmount") ?? "").trim();
  const labelAmount = rawLabel === "" ? null : Number(rawLabel);
  if (
    labelAmount !== null &&
    (!Number.isFinite(labelAmount) || labelAmount <= 0)
  ) {
    return { ok: false, error: "Label amount must be a number above zero." };
  }
  const labelUnit =
    labelAmount === null
      ? null
      : (textOrNull(formData.get("labelUnit")) ?? "mg");

  const res = await staffFetch(`/batch/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      batchNumber,
      quantity,
      labelAmount,
      labelUnit,
      capColor: textOrNull(formData.get("capColor")),
      crimpColor: textOrNull(formData.get("crimpColor")),
      manufacturerDisclosed: formData.get("manufacturerDisclosed") === "true",
    }),
  });
  if (!res.ok) return { ok: false, error: await explain(res, "Update failed") };
  revalidatePath("/qc/batch");
  return { ok: true };
}

// Sets or clears where a report lives on the lab's own site. A blank box
// clears it. The API has the final say on what counts as a safe link.
export async function updateReportLink(
  id: string,
  url: string,
): Promise<
  { ok: true; resultUrl: string | null } | { ok: false; error: string }
> {
  const res = await staffFetch(`/coa/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ resultUrl: url.trim() || null }),
  });
  if (!res.ok)
    return { ok: false, error: await explain(res, "Link not saved") };
  const body = (await res.json()) as { resultUrl: string | null };
  return { ok: true, resultUrl: body.resultUrl };
}

// The lab reports on file for one batch, read when its row is opened.
export async function batchReports(
  id: number,
): Promise<{ ok: true; reports: LabReport[] } | { ok: false; error: string }> {
  const res = await staffFetch(`/batch/${id}/coa`);
  if (!res.ok)
    return { ok: false, error: await explain(res, "Reports unavailable") };
  return { ok: true, reports: (await res.json()) as LabReport[] };
}

// The vials on one report with their results, read when the report shows.
export async function reportSamples(
  coaId: string,
): Promise<
  { ok: true; samples: ReportSample[] } | { ok: false; error: string }
> {
  const res = await staffFetch(`/coa/${coaId}/samples`);
  if (!res.ok)
    return { ok: false, error: await explain(res, "Samples unavailable") };
  return { ok: true, samples: (await res.json()) as ReportSample[] };
}

// Adds a vial to a report or corrects one on it. The API checks every
// reading against its test, so what it refuses comes back as the error.
export async function saveSample(
  coaId: string,
  body: {
    sampleId?: string;
    results: { assayDefId: number; result: unknown }[];
  },
): Promise<{ ok: true; sample: ReportSample } | { ok: false; error: string }> {
  const res = await staffFetch(`/coa/${coaId}/samples`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok)
    return { ok: false, error: await explain(res, "Sample not saved") };
  return { ok: true, sample: (await res.json()) as ReportSample };
}

export async function removeSample(
  coaId: string,
  sampleId: string,
): Promise<ActionResult> {
  const res = await staffFetch(`/coa/${coaId}/samples/${sampleId}`, {
    method: "DELETE",
  });
  if (!res.ok)
    return { ok: false, error: await explain(res, "Sample not removed") };
  return { ok: true };
}

// Sets what a test's readings are held to. Verdicts are worked out when
// results are read, so the list is refreshed to show the new judgement.
export async function updateStandard(
  id: number,
  body: {
    specMin?: number | null;
    specMax?: number | null;
    specExpected?: string | null;
    specVsLabel?: boolean;
  },
): Promise<ActionResult> {
  const res = await staffFetch(`/assays/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok)
    return { ok: false, error: await explain(res, "Standard not saved") };
  revalidatePath("/qc/batch");
  return { ok: true };
}
