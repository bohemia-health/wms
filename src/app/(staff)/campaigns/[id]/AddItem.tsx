"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlusIcon } from "lucide-react";
import { addCampaignItem } from "../actions";

export function AddItem({
  campaignId,
  forms,
  codes,
}: {
  campaignId: string;
  forms: string[];
  // Existing products, offered as suggestions for the code field.
  codes: { code: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(forms[0] ?? "injectable");

  // onSubmit, not <form action>: React clears an action form once the
  // action finishes, which would wipe the fields when the API says no.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    formData.set("form", form);
    startTransition(async () => {
      const result = await addCampaignItem(campaignId, formData);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add item
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add item</SheetTitle>
            <SheetDescription>
              A campaign item belongs to this campaign only. It never shares
              stock with the store.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="grid gap-5 px-4 pb-6">
            <div className="grid gap-2">
              <Label htmlFor="item-code">Product code</Label>
              <Input
                id="item-code"
                name="code"
                list="item-code-options"
                placeholder="RT"
                autoComplete="off"
                required
                autoFocus
              />
              <datalist id="item-code-options">
                {codes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.title}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Pick an existing product, or type a new code to start one.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input id="item-name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item-size">Size (mg)</Label>
                <Input id="item-size" name="size" inputMode="decimal" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-form">Form</Label>
                <Select
                  value={form}
                  onValueChange={(v) => setForm(String(v))}
                  items={forms.map((f) => ({ value: f, label: f }))}
                >
                  <SelectTrigger id="item-form" className="w-full capitalize">
                    <SelectValue />
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-price">Price per kit</Label>
              <Input id="item-price" name="price" inputMode="decimal" placeholder="150.00" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item-moq">MOQ (kits)</Label>
                <Input id="item-moq" name="moq" inputMode="numeric" placeholder="100" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-moq-price">Price at MOQ</Label>
                <Input id="item-moq-price" name="moqPrice" inputMode="decimal" placeholder="135.00" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending} className="justify-self-start">
              {pending ? "Adding…" : "Add item"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
