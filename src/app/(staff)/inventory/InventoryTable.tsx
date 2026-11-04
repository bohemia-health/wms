"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
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
import {
  ChevronRightIcon,
  EyeOffIcon,
  FlaskConicalIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import {
  addBatch,
  deleteBatch,
  deleteItem,
  updateBatch,
  updateItem,
} from "./actions";
import type { Batch, Item, Vendor } from "./item/types";

const sizes = Array.from({ length: 10 }, (_, i) => String((i + 1) * 10));
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const onHand = (item: Item) =>
  item.batches.reduce((sum, b) => sum + (b.quantity ?? 0), 0);

// Vendors named on an item's batches, short names first, deduplicated.
function vendorsOf(item: Item) {
  return [...new Set(item.batches.map((b) => b.vendorShort ?? b.vendor))];
}

// Search and the filters are the admin's, so they live in the browser; the
// list itself comes from the server and is refetched after every change.
// One row opens at a time: its editor sits directly beneath it.
export function InventoryTable({
  items,
  forms,
  vendors,
}: {
  items: Item[];
  forms: string[];
  vendors: Vendor[];
}) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (form === "all" ||
          (form === "hidden" ? !item.listed : item.form === form)) &&
        (!q ||
          item.name.toLowerCase().includes(q) ||
          (item.slug ?? "").includes(q) ||
          (item.size ?? "").includes(q) ||
          item.batches.some(
            (b) =>
              b.batchNumber.toLowerCase().includes(q) ||
              b.vendor.toLowerCase().includes(q),
          )),
    );
  }, [items, query, form]);
  const hiddenCount = items.filter((i) => !i.listed).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroupInput
            placeholder="Search name, batch or vendor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Tabs value={form} onValueChange={(v) => setForm(String(v))}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {forms.map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">
                {f}
              </TabsTrigger>
            ))}
            {hiddenCount > 0 && (
              <TabsTrigger value="hidden">
                <EyeOffIcon data-icon="inline-start" />
                Hidden
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Item</TableHead>
              <TableHead>Form</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden xl:table-cell">Slug</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <PackageIcon className="size-5" />
                    <p className="text-sm">
                      {items.length === 0
                        ? "No items yet. Add one to list it on the store."
                        : "Nothing matches that search."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {visible.map((item) => {
              const open = item.id === openId;
              const stock = onHand(item);
              const names = vendorsOf(item);
              return (
                <Fragment key={item.id}>
                  <TableRow
                    onClick={() => setOpenId(open ? null : item.id)}
                    data-state={open ? "open" : undefined}
                    className="cursor-pointer data-[state=open]:bg-muted/50"
                  >
                    <TableCell className="pl-4">
                      <ChevronRightIcon
                        className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.size && (
                          <span className="text-muted-foreground tabular-nums">
                            {item.size} mg
                          </span>
                        )}
                        {!item.listed && (
                          <Badge variant="outline" className="text-muted-foreground">
                            <EyeOffIcon />
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.form ? (
                        <Badge variant="secondary" className="capitalize">
                          {item.form}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {currency.format(Number(item.price))}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
                      {Number(item.unitPrice) > 0
                        ? currency.format(Number(item.unitPrice))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {item.batches.length === 0 ? (
                        <span className="text-muted-foreground">No batches</span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-medium tabular-nums">
                            {stock.toLocaleString("en-US")}
                          </span>
                          <span className="text-muted-foreground">
                            in {item.batches.length}{" "}
                            {item.batches.length === 1 ? "batch" : "batches"} ·{" "}
                            {names.join(", ")}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                      {item.slug ?? "—"}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t bg-muted/30 px-6 py-5 duration-200">
                          <ItemEditor
                            item={item}
                            forms={forms}
                            vendors={vendors}
                            onDone={() => setOpenId(null)}
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
        {visible.length === items.length
          ? `${items.length} ${items.length === 1 ? "item" : "items"}`
          : `${visible.length} of ${items.length} items`}
      </p>
    </section>
  );
}

// The item's own fields in one form, then its batches, each a form of its
// own: a batch saves on its own without touching the item, and HTML does
// not allow a form inside a form.
function ItemEditor({
  item,
  forms,
  vendors,
  onDone,
}: {
  item: Item;
  forms: string[];
  vendors: Vendor[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(item.size);
  const [form, setForm] = useState<string | null>(item.form);
  const [listed, setListed] = useState(item.listed);
  const reports = item.batches.reduce((n, b) => n + b.labReports, 0);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateItem(item.id, formData);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    // Clicks inside the editor must not toggle the row it sits under.
    <div className="grid gap-6" onClick={(e) => e.stopPropagation()}>
      <form action={submit} className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            Edit {item.name} {item.size && `${item.size} mg`}
          </h2>
          <dl className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Slug</dt>
              <dd className="font-mono">{item.slug ?? "—"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>ID</dt>
              <dd className="font-mono">{item.id.slice(0, 8)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor={`name-${item.id}`}>Name</Label>
            <Input
              id={`name-${item.id}`}
              name="name"
              defaultValue={item.name}
              required
              className="bg-background"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`size-${item.id}`}>Size (mg)</Label>
            <Select name="size" value={size} onValueChange={setSize} required>
              <SelectTrigger id={`size-${item.id}`} className="w-full bg-background">
                <SelectValue />
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
            <Label htmlFor={`form-${item.id}`}>Form</Label>
            <Select name="form" value={form} onValueChange={setForm} required>
              <SelectTrigger
                id={`form-${item.id}`}
                className="w-full bg-background capitalize"
              >
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

          <div className="grid gap-2">
            <Label htmlFor={`price-${item.id}`}>Price (USD)</Label>
            <Input
              id={`price-${item.id}`}
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item.price}
              required
              className="bg-background tabular-nums"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`unit-${item.id}`}>Unit price (USD)</Label>
            <Input
              id={`unit-${item.id}`}
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item.unitPrice}
              className="bg-background tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Label className="flex items-center gap-2.5">
              <Switch checked={listed} onCheckedChange={setListed} />
              <span>
                Listed on store
                {!listed && (
                  <span className="pl-1.5 text-xs font-normal text-muted-foreground">
                    hidden from customers, kept here
                  </span>
                )}
              </span>
            </Label>
            <input type="hidden" name="listed" value={String(listed)} />

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  />
                }
              >
                <Trash2Icon data-icon="inline-start" />
                Delete item
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {item.name} {item.size && `${item.size} mg`}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the item, its {item.batches.length}{" "}
                    {item.batches.length === 1 ? "batch" : "batches"}
                    {reports > 0 &&
                      ` and the ${reports} lab ${reports === 1 ? "report" : "reports"} attached to them`}
                    , takes it off the store and out of any customer&rsquo;s
                    bag. It cannot be undone. To keep the stock and reports,
                    turn off &ldquo;Listed on store&rdquo; instead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={remove}>
                    Delete item
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onDone}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Update item"}
            </Button>
          </div>
        </div>
      </form>

      <BatchList item={item} vendors={vendors} />
    </div>
  );
}

function BatchList({ item, vendors }: { item: Item; vendors: Vendor[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="grid gap-3 border-t pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Batches
          <span className="pl-2 font-normal text-muted-foreground tabular-nums">
            {onHand(item).toLocaleString("en-US")} on hand
          </span>
        </h3>
        {!adding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Add batch
          </Button>
        )}
      </div>

      {item.batches.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No stock recorded. Add a batch to put this item in the warehouse.
        </p>
      )}

      <div className="grid gap-2">
        {item.batches.map((batch) => (
          <BatchRow key={batch.id} batch={batch} vendors={vendors} />
        ))}
        {adding && (
          <BatchRow
            itemId={item.id}
            vendors={vendors}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    </section>
  );
}

// One batch's own form: vendor, number and quantity, saved on its own. With
// no `batch` it is the blank row for a new one.
function BatchRow({
  batch,
  itemId,
  vendors,
  onClose,
}: {
  batch?: Batch;
  itemId?: string;
  vendors: Vendor[];
  onClose?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(
    batch ? String(batch.vendorId) : (vendors[0] ? String(vendors[0].publicId) : null),
  );
  const key = batch ? `b${batch.id}` : `new-${itemId}`;
  // value -> label, so the closed select shows the vendor's name, not its id.
  const vendorItems = vendors.map((v) => ({
    value: String(v.publicId),
    label: v.name,
  }));

  function save(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = batch
        ? await updateBatch(batch.id, formData)
        : await addBatch(itemId!, formData);
      if (!result.ok) setError(result.error);
      else onClose?.();
    });
  }

  function remove() {
    if (!batch) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBatch(batch.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form
      action={save}
      className="grid items-end gap-3 rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_6rem_11rem]"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`${key}-vendor`} className="text-xs text-muted-foreground">
          Vendor
        </Label>
        <Select
          name="vendorId"
          items={vendorItems}
          value={vendorId}
          onValueChange={setVendorId}
          required
        >
          <SelectTrigger id={`${key}-vendor`} className="w-full">
            <SelectValue placeholder="Choose a vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.publicId} value={String(v.publicId)}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${key}-number`} className="text-xs text-muted-foreground">
          Batch number
        </Label>
        <Input
          id={`${key}-number`}
          name="batchNumber"
          defaultValue={batch?.batchNumber ?? ""}
          placeholder="RE30-0115"
          required
          className="font-mono"
          autoFocus={!batch}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${key}-qty`} className="text-xs text-muted-foreground">
          Quantity
        </Label>
        <Input
          id={`${key}-qty`}
          name="quantity"
          type="number"
          min="0"
          step="1"
          defaultValue={batch?.quantity ?? 0}
          required
          className="tabular-nums"
        />
      </div>
      <div className="flex items-center justify-end gap-1">
        {batch && batch.labReports > 0 && (
          <Badge variant="outline" className="mr-2 text-muted-foreground">
            <FlaskConicalIcon />
            {batch.labReports} {batch.labReports === 1 ? "report" : "reports"}
          </Badge>
        )}
        <Button type="submit" size="sm" variant={batch ? "outline" : "default"} disabled={pending}>
          {pending ? "Saving…" : batch ? "Save" : "Add"}
        </Button>
        {batch ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Remove batch"
            disabled={pending}
            onClick={remove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive sm:col-span-4" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
