"use server";

import { headers } from "next/headers";
import type { ContainerLabel } from "@/lib/container-label";

// A throwaway container label from the API, for trying the printer. The
// code is not saved anywhere.
export async function getSampleLabel(): Promise<
  { ok: true; label: ContainerLabel } | { ok: false; error: string }
> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/staff/labels/container/sample`,
    { headers: { cookie }, cache: "no-store" },
  );
  if (!res.ok) return { ok: false, error: `Could not get a label (${res.status})` };
  return { ok: true, label: await res.json() };
}
