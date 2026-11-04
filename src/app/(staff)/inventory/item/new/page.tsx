import { headers } from "next/headers";

import { ItemForm } from "./ItemForm";
import type { ItemCode, Vendor } from "../types";

export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [formRes, vendorRes, productRes] = await Promise.all([
    fetch(`${api}/item-forms`, { cache: "no-store" }),
    fetch(`${api}/vendors`, { headers: { cookie }, cache: "no-store" }),
    fetch(`${api}/item-codes`, { headers: { cookie }, cache: "no-store" }),
  ]);
  const forms: string[] = await formRes.json();
  const vendors: Vendor[] = vendorRes.ok ? await vendorRes.json() : [];
  const products: ItemCode[] = productRes.ok ? await productRes.json() : [];
  const vendorItems = vendors.map((v) => ({
    value: String(v.publicId),
    label: v.name,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">New item</h1>
        <p className="text-sm text-muted-foreground">
          One size of a product, with the first batch that stocks it. A code
          the catalogue doesn&rsquo;t know starts a new product.
        </p>
      </header>
      <ItemForm forms={forms} vendorItems={vendorItems} products={products} />
    </main>
  );
}
