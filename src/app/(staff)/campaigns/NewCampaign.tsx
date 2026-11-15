"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlusIcon } from "lucide-react";
import { createCampaign } from "./actions";

export function NewCampaign() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // onSubmit, not <form action>: React clears an action form once the
  // action finishes, which would wipe the fields when the API says no.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createCampaign(formData);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        New campaign
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New campaign</SheetTitle>
            <SheetDescription>
              It starts as a draft. Add its items and open it when it is ready.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="grid gap-5 px-4 pb-6">
            <div className="grid gap-2">
              <Label htmlFor="campaign-title">Title</Label>
              <Input id="campaign-title" name="title" required autoFocus />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending} className="justify-self-start">
              {pending ? "Creating…" : "Create campaign"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
