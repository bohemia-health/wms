"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

import { createItem } from "./actions";
import type { ItemCode } from "../types";

const sizes = Array.from({ length: 10 }, (_, i) => String((i + 1) * 10));

// The shortest unused run of the name's first letters: Retatrutide gets RE.
function generateCode(name: string, products: ItemCode[]) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  const taken = new Set(products.map((p) => p.code.toUpperCase()));
  for (let length = 2; length <= Math.min(letters.length, 20); length++) {
    const code = letters.slice(0, length);
    if (!taken.has(code)) return code;
  }
  return "";
}

// Today in the admin's own timezone, as a date input wants it: 2026-11-01.
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// RE30-0115: code, size, then the batch date's month and day.
function batchNumberFor(code: string, size: string | null, date: string) {
  if (!code || !size || !date) return "";
  const [, month, day] = date.split("-");
  return `${code}${size}-${month}${day}`;
}

export function ItemForm({
  forms,
  vendorItems,
  products,
}: {
  forms: string[];
  vendorItems: { value: string; label: string }[];
  products: ItemCode[];
}) {
  const [code, setCode] = useState("");
  const [codeWasGenerated, setCodeWasGenerated] = useState(false);
  const [name, setName] = useState("");
  const [confirmedName, setConfirmedName] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [batchDate, setBatchDate] = useState(today);
  // Null follows the automatic number; a typed one (50AM-0226) replaces it.
  const [typedBatchNumber, setTypedBatchNumber] = useState<string | null>(null);

  const product = products.find((p) => p.code === code);
  const batchNumber =
    typedBatchNumber ?? batchNumberFor(code, size, batchDate);

  function changeCode(value: string) {
    const next = value.toUpperCase();
    setCode(next);
    setCodeWasGenerated(false);
    const found = products.find((p) => p.code === next);
    if (found) setName(found.title);
  }

  // Once a code names a product the name no longer touches it, so renaming
  // the item can never change its code.
  function changeName(value: string) {
    setName(value);
    if (product) return;
    const found = products.find(
      (p) => p.title.toLowerCase() === value.trim().toLowerCase(),
    );
    if (found) {
      setCode(found.code);
      setCodeWasGenerated(false);
    } else if (code === "" || codeWasGenerated) {
      setCode(generateCode(value, products));
      setCodeWasGenerated(true);
    }
  }

  function confirmName() {
    if (!product || name === product.title || name === confirmedName) return;
    const sure = window.confirm(
      `Are you sure you want to change "${product.title}" to "${name}"? The product code stays ${product.code}.`,
    );
    if (sure) setConfirmedName(name);
    else setName(product.title);
  }

  return (
    <form action={createItem}>
      <section className="max-w-[10rem]">
        <Label htmlFor="code" className="text-md">
          Product code
        </Label>
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => changeCode(e.target.value)}
          maxLength={20}
          required
          className="ring-1 ring-foreground/25 rounded-sm"
        />
        {code && (
          <p className="mt-1 text-xs text-muted-foreground">
            {product ? "Existing product" : "New product"}
          </p>
        )}
      </section>

      <section className="flex gap-2">
        <div className="flex flex-col gap-2 max-w-md">
          <Label htmlFor="name" className="text-md">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => changeName(e.target.value)}
            onBlur={confirmName}
            required
            className="ring-1 ring-foreground/25 rounded-sm"
          />
        </div>

        <div className=" flex flex-col gap-2 max-w-xs">
          <Label htmlFor="size" className="text-md">
            Size
          </Label>
          <Select name="size" value={size} onValueChange={setSize} required>
            <SelectTrigger id="size" className="text-black!">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section>
        <Label htmlFor="form" className="text-md">
          Form
        </Label>
        <Select name="form" required>
          <SelectTrigger id="form" className="text-black!">
            <SelectValue placeholder="injectable" />
          </SelectTrigger>

          <SelectContent>
            {forms.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="max-w-lg!">
        <Label htmlFor="vendor" className="text-md">
          Vendor
        </Label>
        <Select name="vendorId" items={vendorItems} required>
          <SelectTrigger id="vendor" className="text-black! gap-4! px-3!">
            <SelectValue placeholder="Uther Pharmaceuticals" />
          </SelectTrigger>

          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            className="w-auto!"
          >
            {vendorItems.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="max-w-[5.5rem]">
        <Label htmlFor="price" className="text-md">
          Price
        </Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="150.00"
          required
        />
      </section>

      <section className="max-w-[5.5rem]">
        <Label htmlFor="quantity" className="text-md">
          Quantity
        </Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          step="1"
          min="0"
          placeholder="100"
          required
        />
      </section>

      <section className="max-w-[10rem]">
        <Label htmlFor="batchDate" className="text-md">
          Batch date
        </Label>
        <Input
          id="batchDate"
          type="date"
          value={batchDate}
          onChange={(e) => setBatchDate(e.target.value)}
          required
        />
      </section>

      <section className="max-w-[10rem]">
        <Label htmlFor="batchNumber" className="text-md">
          Batch number
        </Label>
        <Input
          id="batchNumber"
          name="batchNumber"
          value={batchNumber}
          onChange={(e) => setTypedBatchNumber(e.target.value)}
          required
        />
      </section>

      <Button type="submit">Create item</Button>
    </form>
  );
}
