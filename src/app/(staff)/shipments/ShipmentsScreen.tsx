import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewShipment } from "./NewShipment";
import { ShipmentsTable } from "./ShipmentsTable";
import { ATTENTION, type Courier, type ItemPick, type Pick, type Shipment } from "./types";

export type Pickers = {
  couriers: Courier[];
  labs: Pick[];
  campaigns: Pick[];
  items: ItemPick[];
};

export function ShipmentsScreen({
  shipments,
  ...pickers
}: { shipments: Shipment[] } & Pickers) {
  const moving = (d: "INBOUND" | "OUTBOUND") =>
    shipments.filter((s) => s.direction === d && !["DELIVERED", "RETURNED", "REJECTED"].includes(s.status)).length;
  const attention = shipments.filter((s) => ATTENTION.has(s.status)).length;
  const unverified = shipments.filter(
    (s) => s.direction === "INBOUND" && s.status === "DELIVERED" && s.verificationStatus !== "VERIFIED",
  ).length;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">
            Parcels coming in from vendors and labs, and going out to
            customers. Select one to update it.
          </p>
        </div>
        <NewShipment {...pickers} />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        <Card>
          <CardHeader>
            <CardDescription>Inbound</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{moving("INBOUND")}</CardTitle>
            <p className="text-sm text-muted-foreground">on the way to us</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Outbound</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{moving("OUTBOUND")}</CardTitle>
            <p className="text-sm text-muted-foreground">on the way to customers</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Needs attention</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{attention}</CardTitle>
            <p className="text-sm text-muted-foreground">held, delayed or unknown</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>To verify</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{unverified}</CardTitle>
            <p className="text-sm text-muted-foreground">delivered, not yet checked in</p>
          </CardHeader>
        </Card>
      </section>

      <ShipmentsTable shipments={shipments} {...pickers} />
    </main>
  );
}
