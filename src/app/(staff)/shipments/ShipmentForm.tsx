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
import { humanize, shortDateTime, toLocalInput } from "@/lib/format";
import { CheckIcon, PlusIcon, RefreshCwIcon, XIcon } from "lucide-react";

import { createShipment, lookupOrder, refreshTracking, updateShipment } from "./actions";
import type { Pickers } from "./ShipmentsScreen";
import {
  SHIPMENT_STATUSES,
  VERIFICATIONS,
  type Allocation,
  type Direction,
  type Shipment,
  type ShipmentInput,
  type ShipmentStatus,
  type Verification,
} from "./types";

const NONE = "__none__";
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

type LineDraft = { key: number; itemId: string; allocation: Allocation; quantity: string };

// One form for both jobs: with a `shipment` it edits that one, without it
// creates. The caller decides where it lives (a sheet, a table row).
export function ShipmentForm({
  shipment,
  couriers,
  labs,
  campaigns,
  items,
  onDone,
  footerStart,
}: Pickers & {
  shipment?: Shipment;
  onDone: () => void;
  footerStart?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [courierId, setCourierId] = useState(shipment?.courierId ?? couriers[0]?.id ?? "");
  const [direction, setDirection] = useState<Direction>(shipment?.direction ?? "INBOUND");
  const [status, setStatus] = useState<ShipmentStatus>(shipment?.status ?? "PRE_FILED");
  const [verification, setVerification] = useState<string>(shipment?.verificationStatus ?? NONE);
  // The order link: an id once a typed number resolves, null for none, and
  // "unresolved" while a number is typed but not yet looked up or not found.
  const [orderId, setOrderId] = useState<string | null | "unresolved">(shipment?.orderId ?? null);
  const [labId, setLabId] = useState(shipment?.labId ?? NONE);
  const [campaignId, setCampaignId] = useState(shipment?.campaignId ?? NONE);
  const [lines, setLines] = useState<LineDraft[]>(
    (shipment?.items ?? []).map((l, i) => ({
      key: i,
      itemId: l.itemId,
      allocation: l.allocation,
      quantity: String(l.quantity),
    })),
  );
  const [nextKey, setNextKey] = useState(lines.length);
  const id = shipment?.id ?? "new";
  // Status, location and the dates belong to the carrier once its feed has
  // written them; "Edit manually" hands them back for the odd correction.
  const courier = couriers.find((c) => c.id === courierId);
  const tracked = Boolean(shipment?.trackedAt);
  const [manual, setManual] = useState(!tracked);
  const locked = tracked && !manual;
  const canRefresh = Boolean(shipment?.trackingNumber && courier?.trackingCode);
  const [refreshing, startRefresh] = useTransition();
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  function refresh() {
    if (!shipment) return;
    setRefreshNote(null);
    startRefresh(async () => {
      const r = await refreshTracking(shipment.id);
      setRefreshNote(
        r.ok
          ? `Carrier says ${humanize(r.status)}${r.events ? `, ${r.events} new ${r.events === 1 ? "event" : "events"}` : ""}`
          : r.error,
      );
    });
  }
  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name}${i.size ? ` ${i.size} mg` : ""}`,
  }));

  function addLine() {
    setLines([...lines, { key: nextKey, itemId: items[0]?.id ?? "", allocation: "store", quantity: "1" }]);
    setNextKey(nextKey + 1);
  }
  function patchLine(key: number, patch: Partial<LineDraft>) {
    setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function submit(formData: FormData) {
    setError(null);
    const carrierFields = locked
      ? {
          status: shipment!.status,
          currentLocation: shipment!.currentLocation,
          shippedAt: shipment!.shippedAt,
          expectedAt: shipment!.expectedAt,
          receivedAt: shipment!.receivedAt,
        }
      : {
          status,
          currentLocation: String(formData.get("currentLocation") ?? "") || null,
          shippedAt: toIso(String(formData.get("shippedAt") ?? "")),
          expectedAt: toIso(String(formData.get("expectedAt") ?? "")),
          receivedAt: toIso(String(formData.get("receivedAt") ?? "")),
        };
    const input: ShipmentInput = {
      courierId,
      direction,
      ...carrierFields,
      verificationStatus: verification === NONE ? null : (verification as Verification),
      trackingNumber: String(formData.get("trackingNumber") ?? "") || null,
      orderId: orderId === "unresolved" ? null : orderId,
      labId: labId === NONE ? null : labId,
      campaignId: campaignId === NONE ? null : campaignId,
      items: lines
        .filter((l) => l.itemId)
        .map((l) => ({ itemId: l.itemId, allocation: l.allocation, quantity: Number(l.quantity) })),
    };
    startTransition(async () => {
      const r = shipment ? await updateShipment(shipment.id, input) : await createShipment(input);
      if (r.ok) onDone();
      else setError(r.error);
    });
  }

  const field = "bg-background";

  return (
    <form action={submit} className="@container grid gap-5" onClick={(e) => e.stopPropagation()}>
      <div className="grid gap-4 @md:grid-cols-2 @3xl:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor={`courier-${id}`}>Courier</Label>
          <Select
            value={courierId}
            onValueChange={(v) => setCourierId(String(v))}
            items={couriers.map((c) => ({ value: c.id, label: c.name }))}
            required
          >
            <SelectTrigger id={`courier-${id}`} className={`w-full ${field}`}>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`direction-${id}`}>Direction</Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as Direction)}
            items={[{ value: "INBOUND", label: "Inbound" }, { value: "OUTBOUND", label: "Outbound" }]}
          >
            <SelectTrigger id={`direction-${id}`} className={`w-full ${field}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INBOUND">Inbound</SelectItem>
              <SelectItem value="OUTBOUND">Outbound</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 @md:col-span-2">
          <Label htmlFor={`tracking-${id}`}>Tracking number</Label>
          <Input
            id={`tracking-${id}`}
            name="trackingNumber"
            defaultValue={shipment?.trackingNumber ?? ""}
            placeholder="9400 1362 0819 2302 9226 87"
            className={`font-mono ${field}`}
          />
        </div>

        {shipment && (tracked || canRefresh) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-xs @md:col-span-2 @3xl:col-span-4">
            <p className="text-muted-foreground">
              {tracked
                ? `Status, location and dates from ${courier?.shortName ?? courier?.name ?? "the carrier"}, ${shortDateTime(shipment.trackedAt)}.`
                : "Not yet heard from the carrier."}
              {refreshNote && <span className="pl-2 text-foreground">{refreshNote}</span>}
            </p>
            <div className="flex items-center gap-1">
              {tracked && (
                <Button type="button" variant="ghost" size="xs" onClick={() => setManual(!manual)}>
                  {manual ? "Lock to carrier" : "Edit manually"}
                </Button>
              )}
              {canRefresh && (
                <Button type="button" variant="outline" size="xs" onClick={refresh} disabled={refreshing}>
                  <RefreshCwIcon data-icon="inline-start" className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Asking…" : "Refresh tracking"}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor={`status-${id}`}>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ShipmentStatus)}
            items={SHIPMENT_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
            disabled={locked}
          >
            <SelectTrigger id={`status-${id}`} className={`w-full capitalize ${field}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {humanize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`verify-${id}`}>Verification</Label>
          <Select
            value={verification}
            onValueChange={(v) => setVerification(String(v))}
            items={[{ value: NONE, label: "Not checked" }, ...VERIFICATIONS.map((v) => ({ value: v, label: humanize(v) }))]}
          >
            <SelectTrigger id={`verify-${id}`} className={`w-full capitalize ${field}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not checked</SelectItem>
              {VERIFICATIONS.map((v) => (
                <SelectItem key={v} value={v} className="capitalize">
                  {humanize(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 @md:col-span-2">
          <Label htmlFor={`location-${id}`}>Current location</Label>
          <Input
            id={`location-${id}`}
            name="currentLocation"
            defaultValue={shipment?.currentLocation ?? ""}
            placeholder="Memphis, TN sort facility"
            className={field}
            disabled={locked}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`shipped-${id}`}>Shipped</Label>
          <Input id={`shipped-${id}`} name="shippedAt" type="datetime-local" defaultValue={toLocalInput(shipment?.shippedAt)} className={field} disabled={locked} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`expected-${id}`}>Expected</Label>
          <Input id={`expected-${id}`} name="expectedAt" type="datetime-local" defaultValue={toLocalInput(shipment?.expectedAt)} className={field} disabled={locked} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`received-${id}`}>Received</Label>
          <Input id={`received-${id}`} name="receivedAt" type="datetime-local" defaultValue={toLocalInput(shipment?.receivedAt)} className={field} disabled={locked} />
        </div>
      </div>

      <div className="grid gap-4 border-t pt-4 @md:grid-cols-3">
        <OrderLookup
          id={`order-${id}`}
          initialNumber={shipment?.orderNumber ?? ""}
          onResolve={setOrderId}
          field={field}
        />
        <PickField id={`lab-${id}`} label="Lab" value={labId} onChange={setLabId} options={labs} none="No lab" field={field} />
        <PickField id={`campaign-${id}`} label="Campaign" value={campaignId} onChange={setCampaignId} options={campaigns} none="No campaign" field={field} />
      </div>

      <section className="grid gap-2 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Contents
            <span className="pl-2 font-normal text-muted-foreground tabular-nums">
              {lines.reduce((n, l) => n + (Number(l.quantity) || 0), 0)} units
            </span>
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={items.length === 0}>
            <PlusIcon data-icon="inline-start" />
            Add line
          </Button>
        </div>
        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground">No items recorded on this parcel.</p>
        )}
        {lines.map((l) => (
          <div key={l.key} className="grid items-center gap-2 rounded-md border bg-background p-2 @md:grid-cols-[1fr_9rem_6rem_auto]">
            <Select value={l.itemId} onValueChange={(v) => patchLine(l.key, { itemId: String(v) })} items={itemOptions}>
              <SelectTrigger aria-label="Item" className="w-full">
                <SelectValue placeholder="Item" />
              </SelectTrigger>
              <SelectContent>
                {itemOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={l.allocation} onValueChange={(v) => patchLine(l.key, { allocation: v as Allocation })}>
              <SelectTrigger aria-label="Allocation" className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store">Store stock</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
              </SelectContent>
            </Select>
            <Input
              aria-label="Quantity"
              type="number"
              min="1"
              step="1"
              value={l.quantity}
              onChange={(e) => patchLine(l.key, { quantity: e.target.value })}
              className="tabular-nums"
            />
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove line" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}>
              <XIcon />
            </Button>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div>{footerStart}</div>
        <div className="flex items-center gap-3">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !courierId || orderId === "unresolved"}>
            {pending ? "Saving…" : shipment ? "Save shipment" : "Create shipment"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Staff hold the order number on the packing slip, so they type it; the
// form confirms who it belongs to before it will save. The dropdown this
// replaces would have listed every order ever placed.
function OrderLookup({
  id,
  initialNumber,
  onResolve,
  field,
}: {
  id: string;
  initialNumber: string;
  onResolve: (orderId: string | null | "unresolved") => void;
  field: string;
}) {
  const [number, setNumber] = useState(initialNumber);
  const [state, setState] = useState<
    { kind: "none" } | { kind: "checking" } | { kind: "found"; customer: string } | { kind: "error"; message: string }
  >(initialNumber ? { kind: "found", customer: "linked" } : { kind: "none" });

  function change(value: string) {
    const next = value.toUpperCase();
    setNumber(next);
    if (!next.trim()) {
      setState({ kind: "none" });
      onResolve(null);
    } else {
      setState({ kind: "checking" });
      onResolve("unresolved");
    }
  }

  async function resolve() {
    if (!number.trim()) return;
    if (state.kind === "found") return;
    setState({ kind: "checking" });
    const r = await lookupOrder(number);
    if (r.ok) {
      setNumber(r.orderNumber);
      setState({ kind: "found", customer: r.customer });
      onResolve(r.id);
    } else {
      setState({ kind: "error", message: r.error });
      onResolve("unresolved");
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Order</Label>
      <Input
        id={id}
        value={number}
        onChange={(e) => change(e.target.value)}
        onBlur={resolve}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            resolve();
          }
        }}
        placeholder="Order number, or blank"
        aria-invalid={state.kind === "error" || undefined}
        className={`font-mono ${field}`}
      />
      <p className="h-4 text-xs">
        {state.kind === "found" && (
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
            <CheckIcon className="size-3" />
            {state.customer}
          </span>
        )}
        {state.kind === "checking" && <span className="text-muted-foreground">Checking…</span>}
        {state.kind === "error" && <span className="text-destructive">{state.message}</span>}
      </p>
    </div>
  );
}

function PickField({
  id,
  label,
  value,
  onChange,
  options,
  none,
  field,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  none: string;
  field: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(String(v))}
        items={[{ value: NONE, label: none }, ...options.map((o) => ({ value: o.id, label: o.label }))]}
      >
        <SelectTrigger id={id} className={`w-full ${field}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{none}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
