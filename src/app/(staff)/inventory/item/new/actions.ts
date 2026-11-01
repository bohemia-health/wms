"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createItem(formData: FormData) {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({
      code: formData.get("code"),
      name: formData.get("name"),
      size: formData.get("size"),
      form: formData.get("form"),
      price: formData.get("price"),
      vendorId: Number(formData.get("vendorId")),
      quantity: Number(formData.get("quantity")),
      batchNumber: formData.get("batchNumber"),
    }),
  });
  if (!res.ok) throw new Error(`POST /items answered ${res.status}`);
  redirect("/inventory");
}
