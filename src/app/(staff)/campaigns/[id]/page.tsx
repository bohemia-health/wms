import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { shortDate } from "@/lib/format";
import { ChevronLeftIcon } from "lucide-react";
import { InventoryTable } from "../../inventory/InventoryTable";
import type { Item, ItemCode, Vendor } from "../../inventory/item/types";
import { AddItem } from "./AddItem";
import { StatusSelect } from "./StatusSelect";
import type { Campaign } from "../types";

export const instant = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const staff = { headers: { cookie }, cache: "no-store" } as const;
  const [res, itemRes, formRes, vendorRes, codeRes] = await Promise.all([
    fetch(`${api}/campaigns/${id}`, staff),
    // The staff view of the items: batches, vendors and hidden ones included.
    fetch(`${api}/staff/items?campaign=${encodeURIComponent(id)}`, staff),
    fetch(`${api}/item-forms`, { cache: "no-store" }),
    fetch(`${api}/vendors`, staff),
    fetch(`${api}/item-codes`, staff),
  ]);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`campaigns/${id} answered ${res.status}`);
  if (!itemRes.ok) throw new Error(`staff/items answered ${itemRes.status}`);
  const campaign: Campaign = await res.json();
  const items: Item[] = await itemRes.json();
  const forms: string[] = formRes.ok ? await formRes.json() : ["injectable"];
  const vendors: Vendor[] = vendorRes.ok ? await vendorRes.json() : [];
  const codes: ItemCode[] = codeRes.ok ? await codeRes.json() : [];

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <Link
        href="/campaigns"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        Campaigns
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground">
            #{campaign.id} · Opens {shortDate(campaign.opens_at)} · Closes{" "}
            {shortDate(campaign.closes_at)}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <StatusSelect id={campaign.id} status={campaign.status ?? "draft"} />
          <AddItem campaignId={campaign.id} forms={forms} codes={codes} />
        </div>
      </header>

      <InventoryTable items={items} forms={forms} vendors={vendors} campaign />
    </main>
  );
}
