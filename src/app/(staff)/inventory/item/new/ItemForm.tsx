"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  // Lazy, and the route is dynamic, so this is the admin's today.
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

  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) {
    startTransition(() => createItem(formData));
  }

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product</CardTitle>
            <CardDescription>
              Type a code to pick an existing product, or a name to start one.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={code}
                onChange={(e) => changeCode(e.target.value)}
                maxLength={20}
                required
                className="font-mono uppercase"
                placeholder="RE"
              />
              <p className="h-4 text-xs text-muted-foreground">
                {code &&
                  (product ? (
                    <Badge variant="outline">Existing product</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      New product
                    </Badge>
                  ))}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => changeName(e.target.value)}
                onBlur={confirmName}
                required
                placeholder="Retatrutide"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Size (mg)</Label>
              <Select name="size" value={size} onValueChange={setSize} required>
                <SelectTrigger id="size" className="w-full">
                  <SelectValue placeholder="Pick" />
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
            <div className="grid gap-2">
              <Label htmlFor="form">Form</Label>
              <Select name="form" required>
                <SelectTrigger id="form" className="w-full capitalize">
                  <SelectValue placeholder="injectable" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>First batch</CardTitle>
            <CardDescription>
              Where the stock came from and how much landed. The batch number
              is built from the code, size and date unless you type one.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select name="vendorId" items={vendorItems} required>
                <SelectTrigger id="vendor" className="w-full">
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {vendorItems.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="1"
                min="0"
                placeholder="100"
                required
                className="tabular-nums"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batchDate">Batch date</Label>
              <Input
                id="batchDate"
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batchNumber">Batch number</Label>
              <Input
                id="batchNumber"
                name="batchNumber"
                value={batchNumber}
                onChange={(e) => setTypedBatchNumber(e.target.value)}
                required
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Price is what the store charges. Unit price is what it costs us
              and never leaves the wms.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                required
                className="tabular-nums"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">Unit price (USD)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="61.00"
                className="tabular-nums"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href="/inventory" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create item"}
          </Button>
        </div>
      </div>
    </form>
  );
}
