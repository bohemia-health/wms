"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { humanize, money, shortDate, shortDateTime } from "@/lib/format";
import { Checkbox as Tick } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronRightIcon, PackageIcon, SearchIcon, TruckIcon, XIcon } from "lucide-react";

import { addTracking, getOrder, updateOrderStatus, updateOrdersStatus } from "./actions";
import {
  ORDER_STATUSES,
  customerOf,
  type Courier,
  type OrderDetail,
  type OrderRow,
  type OrderStatus,
} from "./types";

const TABS: { value: string; label: string; statuses?: OrderStatus[] }[] = [
  { value: "all", label: "All" },
  { value: "work", label: "To work", statuses: ["RECEIVED", "OPEN", "ACTION_REQUIRED"] },
  { value: "moving", label: "On the way", statuses: ["SHIPPED", "IN_TRANSIT", "DELAYED"] },
  { value: "done", label: "Completed", statuses: ["COMPLETED"] },
  { value: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
];

export function OrdersTable({ orders, couriers }: { orders: OrderRow[]; couriers: Courier[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = TABS.find((t) => t.value === tab)?.statuses;
    return orders.filter(
      (o) =>
        (!allowed || allowed.includes(o.status)) &&
        (!q ||
          o.orderNumber.toLowerCase().includes(q) ||
          customerOf(o).toLowerCase().includes(q) ||
          (o.email ?? "").toLowerCase().includes(q) ||
          (o.items ?? "").toLowerCase().includes(q)),
    );
  }, [orders, query, tab]);

  // Selection follows what is on screen: ticking the header picks every
  // visible row, and a filter change drops rows that fell out of view.
  const visibleIds = visible.map((o) => o.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id));
  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleIds));
  }
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroupInput
            placeholder="Search order, customer or item"
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

      {selected.size > 0 && (
        <BulkBar
          ids={[...selected]}
          onDone={() => setSelected(new Set())}
        />
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  aria-label="Select all shown"
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onCheckedChange={toggleAll}
                  disabled={visible.length === 0}
                />
              </TableHead>
              <TableHead className="w-8" />
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <PackageIcon className="size-5" />
                    <p className="text-sm">
                      {orders.length === 0 ? "No orders yet." : "Nothing matches."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visible.map((order) => {
              const open = order.id === openId;
              return (
                <Fragment key={order.id}>
                  <TableRow
                    onClick={() => setOpenId(open ? null : order.id)}
                    data-state={open ? "open" : selected.has(order.id) ? "selected" : undefined}
                    className="cursor-pointer data-[state=open]:bg-muted/50"
                  >
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select ${order.orderNumber}`}
                        checked={selected.has(order.id)}
                        onCheckedChange={() => toggle(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon
                        className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                      />
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="grid">
                        <span className="font-medium">{customerOf(order)}</span>
                        <span className="text-xs text-muted-foreground">
                          {[order.city, order.state, order.country]
                            .filter(Boolean)
                            .join(", ") || order.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      <div className="max-w-72 truncate">{order.items ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(order.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        {order.shipmentCount > 0 && (
                          <TruckIcon className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {shortDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="p-0">
                        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t bg-muted/30 px-6 py-5 duration-200">
                          <OrderPanel row={order} couriers={couriers} onDone={() => setOpenId(null)} />
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
        {visible.length === orders.length
          ? `${orders.length} ${orders.length === 1 ? "order" : "orders"}`
          : `${visible.length} of ${orders.length} orders`}
      </p>
    </section>
  );
}

// Everything ticked gets one status. The bar replaces the toolbar's
// position rather than floating, so it never covers a row.
function BulkBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [status, setStatus] = useState<OrderStatus>("SHIPPED");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply() {
    setError(null);
    startTransition(async () => {
      const r = await updateOrdersStatus(ids, status);
      if (r.ok) onDone();
      else setError(r.error);
    });
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-top-1 flex flex-wrap items-center gap-3 rounded-lg border bg-primary px-4 py-2.5 text-primary-foreground duration-150">
      <p className="text-sm font-medium tabular-nums">
        {ids.length} {ids.length === 1 ? "order" : "orders"} selected
      </p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Label htmlFor="bulk-status" className="text-sm text-primary-foreground/80">
          Set status to
        </Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as OrderStatus)}
          items={ORDER_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
        >
          <SelectTrigger id="bulk-status" className="w-48 bg-background text-foreground capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {humanize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="secondary" onClick={apply} disabled={pending}>
          {pending ? "Applying…" : `Apply to ${ids.length}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear selection"
          onClick={onDone}
          disabled={pending}
          className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <XIcon />
        </Button>
      </div>
      {error && (
        <p className="basis-full text-sm text-destructive-foreground" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// The list row knows the headline; the lines, addresses and shipments are
// fetched when the row opens, so the list itself stays one cheap query.
function OrderPanel({ row, couriers, onDone }: { row: OrderRow; couriers: Courier[]; onDone: () => void }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState<OrderStatus>(row.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Bumped after a shipment is added, so the panel shows it without closing.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;
    getOrder(row.orderNumber).then((r) => {
      if (!live) return;
      if (r.ok) setDetail(r.order);
      else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [row.orderNumber, version]);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateOrderStatus(row.id, status);
      if (r.ok) onDone();
      else setError(r.error);
    });
  }

  const shipping = detail?.addresses.find((a) => a.type === "shipping");
  const billing = detail?.addresses.find((a) => a.type === "billing");

  return (
    <div className="grid gap-5" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">
          Order <span className="font-mono">{row.orderNumber}</span>
          <span className="pl-2 text-sm font-normal text-muted-foreground">
            placed {shortDateTime(row.createdAt)}
          </span>
        </h2>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <section className="grid content-start gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lines
          </h3>
          {!detail && !error && <Skeleton className="h-20" />}
          {error && !detail && <p className="text-sm text-muted-foreground">Couldn&rsquo;t load.</p>}
          {detail && (
            <div className="overflow-hidden rounded-md border bg-background text-sm">
              {detail.lines.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-0"
                >
                  <span>
                    <span className="pr-2 font-medium tabular-nums">{l.quantity} ×</span>
                    {l.name}
                  </span>
                  <span className="tabular-nums">{money(Number(l.price) * l.quantity)}</span>
                </div>
              ))}
              <div className="grid gap-1 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(detail.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="tabular-nums">{money(detail.shipping)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">{money(detail.tax)}</span></div>
                <div className="flex justify-between font-medium text-foreground"><span>Total</span><span className="tabular-nums">{money(detail.total)}</span></div>
              </div>
            </div>
          )}
        </section>

        <section className="grid content-start gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ship to
          </h3>
          {!detail && !error && <Skeleton className="h-20" />}
          {error && !detail && <p className="text-sm text-muted-foreground">Couldn&rsquo;t load.</p>}
          {detail && (
            <Address a={shipping} fallback="No shipping address on file." />
          )}
          {billing && (
            <>
              <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bill to
              </h3>
              <Address a={billing} />
            </>
          )}
        </section>

        <section className="grid content-start gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shipments
          </h3>
          {!detail && !error && <Skeleton className="h-20" />}
          {error && !detail && <p className="text-sm text-muted-foreground">Couldn&rsquo;t load.</p>}
          {detail?.shipments.map((s) => (
            <div key={s.id} className="rounded-md border bg-background px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{s.trackingNumber ?? "no tracking"}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {s.courier ?? "—"} · shipped {shortDate(s.shippedAt)}
              </p>
            </div>
          ))}
          {(detail || error) && row.status !== "CANCELLED" && (
            <TrackingForm
              orderId={row.id}
              couriers={couriers}
              onAdded={(shipped) => {
                setVersion((v) => v + 1);
                if (shipped) setStatus("SHIPPED");
              }}
            />
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4">
        <div className="grid gap-2">
          <Label htmlFor={`status-${row.id}`}>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as OrderStatus)}
            items={ORDER_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
          >
            <SelectTrigger id={`status-${row.id}`} className="w-56 bg-background capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {humanize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Close
          </Button>
          <Button type="button" onClick={save} disabled={pending || status === row.status}>
            {pending ? "Saving…" : "Update status"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Tracking typed here ships the order: one outbound shipment, linked, and
// the order marked SHIPPED unless the admin says otherwise.
function TrackingForm({
  orderId,
  couriers,
  onAdded,
}: {
  orderId: string;
  couriers: Courier[];
  onAdded: (shipped: boolean) => void;
}) {
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? "");
  const [tracking, setTracking] = useState("");
  const [markShipped, setMarkShipped] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await addTracking(orderId, { courierId, trackingNumber: tracking, markShipped });
      if (r.ok) {
        setTracking("");
        onAdded(markShipped);
      } else setError(r.error);
    });
  }

  return (
    <div className="mt-1 grid gap-2 rounded-md border border-dashed bg-background/60 p-3">
      <p className="text-xs font-medium">Add tracking</p>
      <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
        <Select
          value={courierId}
          onValueChange={(v) => setCourierId(String(v))}
          items={couriers.map((c) => ({ value: c.id, label: c.shortName ?? c.name }))}
        >
          <SelectTrigger aria-label="Courier" className="w-full bg-background">
            <SelectValue placeholder="Courier" />
          </SelectTrigger>
          <SelectContent>
            {couriers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="Tracking number"
          placeholder="Tracking number"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="bg-background font-mono"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Tick checked={markShipped} onCheckedChange={(v) => setMarkShipped(v === true)} />
          Mark order as shipped
        </Label>
        <Button type="button" size="sm" onClick={submit} disabled={pending || !tracking.trim() || !courierId}>
          {pending ? "Saving…" : "Create shipment"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Address({ a, fallback }: { a?: { name: string | null; line1: string; line2: string | null; line3: string | null; city: string | null; state: string | null; postalCode: string | null; country: string }; fallback?: string }) {
  if (!a) return <p className="text-sm text-muted-foreground">{fallback ?? "—"}</p>;
  return (
    <address className="rounded-md border bg-background px-3 py-2 text-sm not-italic leading-snug">
      {a.name && <div className="font-medium">{a.name}</div>}
      <div>{a.line1}</div>
      {a.line2 && <div>{a.line2}</div>}
      {a.line3 && <div>{a.line3}</div>}
      <div>
        {[a.city, a.state].filter(Boolean).join(", ")} {a.postalCode}
      </div>
      <div className="text-muted-foreground">{a.country}</div>
    </address>
  );
}
