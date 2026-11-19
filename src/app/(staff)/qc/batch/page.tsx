import { headers } from "next/headers";
import { BatchTable } from "./BatchTable";
import { Standards } from "./Standards";
import type { Assay, Batch, BatchRow, Lab } from "./types";

export const instant = false;

type ItemCode = { id: string; code: string; title: string };
type Vendor = { publicId: number; name: string; shortName: string | null };

// The order a lab reads the list in: newest first. Ids only ever go up, so
// the highest id is the batch that arrived last and is likeliest to still
// be waiting on its report.
function labOrder(a: Batch, b: Batch): number {
  return b.id - a.id;
}

// Every batch on file, the way the lab identifies them: batch number,
// product, who made it and what the vial looks like. A row opens to its
// details, lab reports and editor.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string | string[] }>;
}) {
  const { batch: selectedBatch } = await searchParams;
  const batchNumber = typeof selectedBatch === "string" ? selectedBatch : "";
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const staff = { headers: { cookie }, cache: "no-store" } as const;
  const [res, codeRes, vendorRes, labRes, assayRes] = await Promise.all([
    fetch(`${api}/batches`, staff),
    fetch(`${api}/item-codes`, staff),
    fetch(`${api}/vendors`, staff),
    fetch(`${api}/labs`, staff),
    fetch(`${api}/assays`, staff),
  ]);
  if (!res.ok) throw new Error(`batches answered ${res.status}`);
  const batches: Batch[] = await res.json();
  // Names are a nicety: a role that may not read products or vendors still
  // gets the list, with ids where the names would be.
  const codes: ItemCode[] = codeRes.ok ? await codeRes.json() : [];
  const vendors: Vendor[] = vendorRes.ok ? await vendorRes.json() : [];
  const labs: Lab[] = labRes.ok ? await labRes.json() : [];
  // The tests a result can be entered for. Without them (a role that may
  // not read the catalogue) the vials still list; there is nothing to fill.
  const assays: Assay[] = assayRes.ok ? await assayRes.json() : [];

  const codeById = new Map(codes.map((c) => [c.id, c]));
  const vendorById = new Map(vendors.map((v) => [v.publicId, v]));
  const rows: BatchRow[] = batches.toSorted(labOrder).map((b) => {
    const code = codeById.get(b.itemCodeId);
    const vendor = vendorById.get(b.manufacturer);
    return {
      ...b,
      productTitle: code?.title ?? null,
      productCode: code?.code ?? null,
      // Manufacturers always go by their short name.
      manufacturerLabel:
        vendor?.shortName ?? vendor?.name ?? `#${b.manufacturer}`,
      labIds: b.labIds ?? [],
    };
  });
  const matchingBatches = rows.filter((b) => b.batchNumber === batchNumber);
  const unlinked = batches.filter((b) => b.itemId === null).length;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Batches</h1>
        <p className="text-sm text-muted-foreground">
          Review batch details, certificate coverage, and QC readings.
          {" "}{batches.length} on file
          {unlinked > 0 && ` · ${unlinked} awaiting a store item link`}.
        </p>
      </header>

      <BatchTable
        key={batchNumber}
        batches={rows}
        labs={Object.fromEntries(labs.map((lab) => [lab.id, lab.name ?? "Unnamed lab"]))}
        assays={assays}
        initialBatchNumber={batchNumber}
        initialOpenId={batchNumber && matchingBatches.length === 1 ? matchingBatches[0].id : null}
      />

      {assayRes.ok && <Standards assays={assays} />}
    </main>
  );
}
