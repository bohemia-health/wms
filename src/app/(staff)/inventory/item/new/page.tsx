import { headers } from "next/headers";

import { ItemForm } from "./ItemForm";
import type { ItemCode, Vendor } from "../types";

export const instant = false;

export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item-forms`, {
    cache: "no-store",
  });
  const forms: string[] = await res.json();

  const cookie = (await headers()).get("cookie") ?? "";
  const vendorRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, {
    headers: { cookie },
    cache: "no-store",
  });
  const vendors: Vendor[] = await vendorRes.json();
  const vendorItems = vendors.map((v) => ({
    value: String(v.publicId),
    label: v.name,
  }));

  const productRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/item-codes`,
    {
      headers: { cookie },
      cache: "no-store",
    },
  );
  const products: ItemCode[] = await productRes.json();

  return (
    <main className="mx-4">
      <div className="text-center my-4">
        <h1 className="font-semibold text-2xl">Create a new Item</h1>
      </div>

      <ItemForm forms={forms} vendorItems={vendorItems} products={products} />
    </main>
  );
}
