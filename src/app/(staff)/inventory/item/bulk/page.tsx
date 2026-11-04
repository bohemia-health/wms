import { headers } from "next/headers";
import { BulkItemForm } from "./BulkItemForm";
import type { Vendor } from "../types";

export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const [formRes, vendorRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/item-forms`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, {
      headers: { cookie },
      cache: "no-store",
    }),
  ]);
  const forms: string[] = await formRes.json();
  const vendors: Vendor[] = vendorRes.ok ? await vendorRes.json() : [];

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add items in bulk</h1>
        <p className="text-sm text-muted-foreground">
          Paste a sheet or upload a CSV. Every line is checked before anything
          is saved, and they are saved together or not at all.
        </p>
      </header>
      <BulkItemForm forms={forms} vendors={vendors} />
    </main>
  );
}
