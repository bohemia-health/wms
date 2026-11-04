import CreateButton from "@/components/Inventory/CreateInventory";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventoryTable } from "./InventoryTable";
import type { Item, Vendor } from "./item/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// The whole inventory screen, given its data. The route fetches and hands
// it over, so the same screen can be rendered anywhere the data exists.
export function InventoryScreen({
  items,
  forms,
  vendors,
}: {
  items: Item[];
  forms: string[];
  vendors: Vendor[];
}) {
  const hidden = items.filter((i) => !i.listed).length;
  const onHand = items.reduce(
    (sum, i) => sum + i.batches.reduce((s, b) => s + (b.quantity ?? 0), 0),
    0,
  );
  const batchCount = items.reduce((sum, i) => sum + i.batches.length, 0);
  const products = new Set(items.map((i) => i.slug ?? i.name)).size;
  const prices = items.map((i) => Number(i.price)).filter(Number.isFinite);
  const low = prices.length ? Math.min(...prices) : 0;
  const high = prices.length ? Math.max(...prices) : 0;
  const byForm = forms
    .map((f) => ({ form: f, count: items.filter((i) => i.form === f).length }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Every size of every product on the store. Select a row to edit it.
          </p>
        </div>
        <CreateButton />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        <Card>
          <CardHeader>
            <CardDescription>Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {items.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              across {products} {products === 1 ? "product" : "products"}
              {hidden > 0 && ` · ${hidden} hidden from the store`}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Price range</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {currency.format(low)}
              <span className="px-1.5 font-normal text-muted-foreground">–</span>
              {currency.format(high)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">lowest to highest</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>On hand</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {onHand.toLocaleString("en-US")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              in {batchCount} {batchCount === 1 ? "batch" : "batches"}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>By form</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {byForm[0]?.count ?? 0}
              <span className="pl-1.5 text-base font-normal text-muted-foreground capitalize">
                {byForm[0]?.form ?? "—"}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {byForm.length > 1
                ? byForm.slice(1).map((f, i) => (
                    <span key={f.form}>
                      {i > 0 && " · "}
                      {f.count} <span className="capitalize">{f.form}</span>
                    </span>
                  ))
                : "no other forms"}
            </p>
          </CardHeader>
        </Card>
      </section>

      <InventoryTable items={items} forms={forms} vendors={vendors} />
    </main>
  );
}
