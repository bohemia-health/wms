"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  PackageIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteShipment } from "./actions";
import { ShipmentForm } from "./ShipmentForm";
import type { Pickers } from "./ShipmentsScreen";
import { ATTENTION, type Shipment } from "./types";

const TABS = [
  { value: "all", label: "All" },
  { value: "INBOUND", label: "Inbound" },
  { value: "OUTBOUND", label: "Outbound" },
  { value: "attention", label: "Needs attention" },
];

const linkOf = (s: Shipment) =>
  s.orderNumber
    ? { kind: "Order", label: s.orderNumber }
    : s.lab
      ? { kind: "Lab", label: s.lab }
      : s.campaign
        ? { kind: "Campaign", label: s.campaign }
        : null;

export function ShipmentsTable({
  shipments,
  ...pickers
}: { shipments: Shipment[] } & Pickers) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter(
      (s) =>
        (tab === "all" ||
          (tab === "attention" ? ATTENTION.has(s.status) : s.direction === tab)) &&
        (!q ||
          (s.trackingNumber ?? "").toLowerCase().includes(q) ||
          s.courier.toLowerCase().includes(q) ||
          (s.orderNumber ?? "").toLowerCase().includes(q) ||
          (s.lab ?? "").toLowerCase().includes(q) ||
          (s.campaign ?? "").toLowerCase().includes(q) ||
          (s.currentLocation ?? "").toLowerCase().includes(q) ||
          s.items.some((l) => l.name.toLowerCase().includes(q))),
    );
  }, [shipments, query, tab]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroupInput
            placeholder="Search tracking, order, lab or item"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Shipment</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Linked to</TableHead>
              <TableHead className="hidden xl:table-cell">Contents</TableHead>
              <TableHead className="hidden md:table-cell">Expected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <PackageIcon className="size-5" />
                    <p className="text-sm">
                      {shipments.length === 0
                        ? "No shipments yet. Record one when a parcel has a tracking number."
                        : "Nothing matches."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visible.map((s) => {
              const open = s.id === openId;
              const link = linkOf(s);
              const units = s.items.reduce((n, l) => n + l.quantity, 0);
              return (
                <Fragment key={s.id}>
                  <TableRow
                    onClick={() => setOpenId(open ? null : s.id)}
                    data-state={open ? "open" : undefined}
                    className="cursor-pointer data-[state=open]:bg-muted/50"
                  >
                    <TableCell className="pl-4">
                      <ChevronRightIcon
                        className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="grid">
                        <span className="font-mono text-xs font-medium">
                          {s.trackingNumber ?? <span className="font-sans text-muted-foreground">No tracking yet</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.courierShort ?? s.courier}
                          {s.currentLocation && ` · ${s.currentLocation}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {s.direction === "INBOUND" ? <ArrowDownLeftIcon /> : <ArrowUpRightIcon />}
                        {s.direction.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={s.status} />
                        {s.verificationStatus && s.verificationStatus !== "VERIFIED" && (
                          <StatusBadge status={s.verificationStatus} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {link ? (
                        <span>
                          <span className="text-muted-foreground">{link.kind} </span>
                          <span className={link.kind === "Order" ? "font-mono text-xs" : ""}>{link.label}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">
                      <div className="max-w-56 truncate">
                        {s.items.length === 0
                          ? "—"
                          : `${units} units · ${s.items.map((l) => `${l.quantity} × ${l.name}${l.size ? ` ${l.size}` : ""}`).join(", ")}`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {shortDate(s.expectedAt)}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t bg-muted/30 px-6 py-5 duration-200">
                          <ShipmentForm
                            shipment={s}
                            {...pickers}
                            onDone={() => setOpenId(null)}
                            footerStart={<DeleteShipment shipment={s} onDone={() => setOpenId(null)} />}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {visible.length === shipments.length
          ? `${shipments.length} ${shipments.length === 1 ? "shipment" : "shipments"}`
          : `${visible.length} of ${shipments.length} shipments`}
      </p>
    </section>
  );
}

function DeleteShipment({ shipment, onDone }: { shipment: Shipment; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function remove() {
    startTransition(async () => {
      const r = await deleteShipment(shipment.id);
      if (r.ok) onDone();
      else setError(r.error);
    });
  }
  return (
    <div className="flex items-center gap-3">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button type="button" variant="ghost" disabled={pending} className="text-destructive hover:bg-destructive/10 hover:text-destructive" />
          }
        >
          <Trash2Icon data-icon="inline-start" />
          Delete shipment
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              {shipment.trackingNumber ? `Tracking ${shipment.trackingNumber}` : "This untracked parcel"} and its
              contents are removed from the warehouse record. The linked order, lab or campaign is not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Delete shipment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
