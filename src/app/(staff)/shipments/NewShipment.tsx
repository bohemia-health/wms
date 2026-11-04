"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlusIcon } from "lucide-react";
import { ShipmentForm } from "./ShipmentForm";
import type { Pickers } from "./ShipmentsScreen";

export function NewShipment(pickers: Pickers) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        New shipment
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>New shipment</SheetTitle>
            <SheetDescription>
              Record a parcel as soon as you have a tracking number. Everything
              but courier and direction can be filled in later.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ShipmentForm {...pickers} onDone={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
