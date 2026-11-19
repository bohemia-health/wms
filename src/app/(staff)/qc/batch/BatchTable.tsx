"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
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
import { shortDate } from "@/lib/format";
import { httpsLink } from "@/lib/https-link";
import { batchReports, updateBatch, updateReportLink } from "./actions";
import { reportTypeLabel, reportTypeRank } from "./report-type";
import { ReportSamples } from "./ReportSamples";
import type { Assay, BatchRow, LabReport } from "./types";

// The row keeps to what identifies a batch at a glance. Barcode, vial
// colours and lab reports are in the panel that opens under it.
const COLUMNS = 7;
const PAGE_SIZE = 20;
const ALL = "all";
// The lab filter's choice for batches nobody has tested yet.
const UNTESTED = "untested";

// One row opens at a time: its details and editor sit directly beneath it,
// the same way the Inventory table works. Search, the two filters and the
// paging all run here in the browser: the whole list is already on the page.
export function BatchTable({
  batches,
  labs,
  assays,
  initialBatchNumber,
  initialOpenId,
}: {
  batches: BatchRow[];
  // Lab names by id, for naming the lab on each report.
  labs: Record<string, string>;
  assays: Assay[];
  initialBatchNumber: string;
  initialOpenId: number | null;
}) {
  const [openId, setOpenId] = useState(initialOpenId);
  const [query, setQuery] = useState(initialBatchNumber);
  const [exactBatch, setExactBatch] = useState(Boolean(initialBatchNumber));
  const [vendor, setVendor] = useState(ALL);
  const [lab, setLab] = useState(ALL);
  const [page, setPage] = useState(0);
  // Only batches with a reading that misses its standard.
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const flaggedCount = batches.filter((b) => b.flags > 0).length;

  const vendorOptions = useMemo(
    () => [...new Set(batches.map((b) => b.manufacturerLabel))].sort(),
    [batches],
  );
  const labOptions = useMemo(
    () =>
      [...new Set(batches.flatMap((b) => b.labIds))]
        .map((id) => ({ value: id, label: labs[id] ?? `Lab ${id}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [batches, labs],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter(
      (b) =>
        (!flaggedOnly || b.flags > 0) &&
        (vendor === ALL || b.manufacturerLabel === vendor) &&
        (lab === ALL ||
          (lab === UNTESTED ? b.reports === 0 : b.labIds.includes(lab))) &&
        (exactBatch
          ? b.batchNumber === query
          : !q ||
            b.batchNumber.toLowerCase().includes(q) ||
            String(b.id).includes(q) ||
            (b.sku ?? "").includes(q) ||
            (b.productTitle ?? "").toLowerCase().includes(q) ||
            (b.productCode ?? "").toLowerCase().includes(q) ||
            b.manufacturerLabel.toLowerCase().includes(q)),
    );
  }, [batches, query, exactBatch, vendor, lab, flaggedOnly]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // A save can shrink the list under the current page; stay on a real one.
  const current = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(
    current * PAGE_SIZE,
    (current + 1) * PAGE_SIZE,
  );
  const filtered =
    query.trim() !== "" || vendor !== ALL || lab !== ALL || flaggedOnly;

  // Any change to what is shown starts again from the first page, with
  // nothing open: the open row may no longer be on it.
  function narrow(change: () => void) {
    change();
    setPage(0);
    setOpenId(null);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroupInput
            placeholder="Search batch, product or barcode"
            aria-label="Search batches"
            value={query}
            onChange={(e) => narrow(() => {
              setExactBatch(false);
              setQuery(e.target.value);
            })}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Select
          value={vendor}
          onValueChange={(v) => narrow(() => setVendor(String(v ?? ALL)))}
          items={[
            { value: ALL, label: "All manufacturers" },
            ...vendorOptions.map((v) => ({ value: v, label: v })),
          ]}
        >
          <SelectTrigger className="w-48" aria-label="Manufacturer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All manufacturers</SelectItem>
            {vendorOptions.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={lab}
          onValueChange={(v) => narrow(() => setLab(String(v ?? ALL)))}
          items={[
            { value: ALL, label: "All labs" },
            ...labOptions,
            { value: UNTESTED, label: "No reports yet" },
          ]}
        >
          <SelectTrigger className="w-52" aria-label="Lab">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All labs</SelectItem>
            {labOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
            <SelectItem value={UNTESTED}>No reports yet</SelectItem>
          </SelectContent>
        </Select>

        {flaggedCount > 0 && (
          <Button
            variant={flaggedOnly ? "default" : "outline"}
            aria-pressed={flaggedOnly}
            onClick={() => narrow(() => setFlaggedOnly(!flaggedOnly))}
          >
            Needs attention
            <span className="tabular-nums">{flaggedCount}</span>
          </Button>
        )}

        {filtered && (
          <Button
            variant="ghost"
            onClick={() =>
              narrow(() => {
                setQuery("");
                setExactBatch(false);
                setVendor(ALL);
                setLab(ALL);
                setFlaggedOnly(false);
              })
            }
          >
            Clear
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Batch</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Lab reports</TableHead>
              <TableHead>Store item</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS}
                  className="h-24 text-center text-muted-foreground"
                >
                  {batches.length === 0
                    ? "No batches yet."
                    : "Nothing matches that search."}
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((b) => {
              const open = b.id === openId;
              return (
                <Fragment key={b.id}>
                  <TableRow
                    onClick={() => setOpenId(open ? null : b.id)}
                    data-state={open ? "open" : undefined}
                    className="cursor-pointer data-[state=open]:bg-muted/50"
                  >
                    <TableCell className="pl-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Batch ${b.batchNumber}, ID ${b.id}`}
                        aria-expanded={open}
                        aria-controls={open ? `batch-details-${b.id}` : undefined}
                      >
                        <ChevronRightIcon
                          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.batchNumber}</span>
                        {b.flags > 0 && (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 text-destructive"
                          >
                            {b.flags} flagged
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        #{b.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.productTitle ? (
                        <>
                          <div>{b.productTitle}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.productCode}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{b.manufacturerLabel}</div>
                      {b.manufacturerDisclosed === false && (
                        <div className="text-xs text-muted-foreground">
                          Not disclosed to customers
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      {b.reports > 0 ? b.reports : (
                        <span className="text-muted-foreground">
                          {b.reports === 0 ? "None on file" : "—"}
                        </span>
                      )}
                      {b.unjudged > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {b.unjudged} unable to compare
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.itemId ? (
                        <Badge variant="secondary">Linked</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Not linked
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={COLUMNS} className="p-0">
                        <div
                          id={`batch-details-${b.id}`}
                          className="animate-in fade-in-0 slide-in-from-top-1 border-t bg-muted/30 px-6 py-5 duration-200"
                        >
                          <BatchDetail
                            batch={b}
                            labs={labs}
                            assays={assays}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {visible.length === 0
            ? "0 batches"
            : `${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + pageRows.length} of ${visible.length}`}
          {filtered && ` (${batches.length} in all)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {current + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => {
              setPage(current - 1);
              setOpenId(null);
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => {
              setPage(current + 1);
              setOpenId(null);
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

// What opens under a row: the batch's identifiers, its lab reports, and a
// form for the fields staff may correct.
function BatchDetail({
  batch,
  labs,
  assays,
  onDone,
}: {
  batch: BatchRow;
  labs: Record<string, string>;
  assays: Assay[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [disclosed, setDisclosed] = useState(
    batch.manufacturerDisclosed !== false,
  );

  // The size written into the batch number (RE60-1103, 50AM-0226), offered
  // as a hint only: the convention is not followed everywhere.
  const suggested = /\d+(\.\d+)?/.exec(batch.batchNumber.split("-")[0])?.[0];

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateBatch(batch.id, formData);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    // Clicks inside the panel must not toggle the row it sits under.
    <div
      className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid content-start gap-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Batch ID</dt>
          <dd className="font-mono">{batch.id}</dd>
          <dt className="text-muted-foreground">Barcode</dt>
          <dd className="font-mono">{batch.sku ?? "—"}</dd>
          <dt className="text-muted-foreground">Product</dt>
          <dd>
            {batch.productTitle ?? "—"}
            {batch.productCode && (
              <span className="pl-1.5 text-muted-foreground">
                {batch.productCode}
              </span>
            )}
          </dd>
          <dt className="text-muted-foreground">Manufacturer</dt>
          <dd>{batch.manufacturerLabel}</dd>
          <dt className="text-muted-foreground">Label amount</dt>
          <dd>
            {batch.labelAmount === null ? (
              <span className="text-muted-foreground">
                Not set, so mass readings cannot be judged
              </span>
            ) : (
              `${batch.labelAmount} ${batch.labelUnit ?? ""}`
            )}
          </dd>
          <dt className="text-muted-foreground">Cap / crimp</dt>
          <dd>
            {batch.capColor || batch.crimpColor
              ? `${batch.capColor ?? "—"} / ${batch.crimpColor ?? "—"}`
              : "—"}
          </dd>
          <dt className="text-muted-foreground">Store item</dt>
          <dd className="font-mono text-xs">{batch.itemId ?? "Not linked"}</dd>
        </dl>
        <Reports batchId={batch.id} labs={labs} assays={assays} />
      </div>

      <form action={submit} className="grid content-start gap-4">
        <h2 className="text-base font-semibold">
          Edit batch {batch.batchNumber}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`number-${batch.id}`}>Batch number</Label>
            <Input
              id={`number-${batch.id}`}
              name="batchNumber"
              defaultValue={batch.batchNumber}
              required
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`quantity-${batch.id}`}>Quantity</Label>
            <Input
              id={`quantity-${batch.id}`}
              name="quantity"
              type="number"
              min={0}
              step={1}
              defaultValue={batch.quantity ?? ""}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`cap-${batch.id}`}>Cap colour</Label>
            <Input
              id={`cap-${batch.id}`}
              name="capColor"
              defaultValue={batch.capColor ?? ""}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`crimp-${batch.id}`}>Crimp colour</Label>
            <Input
              id={`crimp-${batch.id}`}
              name="crimpColor"
              defaultValue={batch.crimpColor ?? ""}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`label-${batch.id}`}>Label amount</Label>
            <Input
              id={`label-${batch.id}`}
              name="labelAmount"
              inputMode="decimal"
              defaultValue={batch.labelAmount ?? ""}
              placeholder={suggested ? `e.g. ${suggested}` : undefined}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              What each vial claims to hold. A mass reading below it is flagged.
              {batch.labelAmount === null &&
                suggested &&
                ` The batch number suggests ${suggested}.`}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`unit-${batch.id}`}>Label unit</Label>
            <Input
              id={`unit-${batch.id}`}
              name="labelUnit"
              defaultValue={batch.labelUnit ?? "mg"}
              maxLength={20}
              className="bg-background"
            />
          </div>
        </div>

        <Label className="flex items-center gap-2.5">
          <Switch checked={disclosed} onCheckedChange={setDisclosed} />
          <span>
            Manufacturer shown to customers
            {!disclosed && (
              <span className="pl-1.5 text-xs font-normal text-muted-foreground">
                hidden on the store, kept here
              </span>
            )}
          </span>
        </Label>
        <input
          type="hidden"
          name="manufacturerDisclosed"
          value={String(disclosed)}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          {error && (
            <p className="mr-auto text-sm text-destructive" role="alert">
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
            {pending ? "Saving…" : "Update batch"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// The batch's lab reports, fetched when the row opens so the list page
// does not ask for every batch's reports up front.
function Reports({
  batchId,
  labs,
  assays,
}: {
  batchId: number;
  labs: Record<string, string>;
  assays: Assay[];
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "ready"; reports: LabReport[] }
  >({ status: "loading" });

  useEffect(() => {
    let current = true;
    batchReports(batchId).then((result) => {
      if (!current) return;
      setState(
        result.ok
          ? { status: "ready", reports: result.reports }
          : { status: "error", error: result.error },
      );
    });
    return () => {
      current = false;
    };
  }, [batchId]);

  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-medium">Lab reports</h3>
      {state.status === "loading" && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.status === "ready" && state.reports.length === 0 && (
        <p className="text-sm text-muted-foreground">
          None on file for this batch.
        </p>
      )}
      {state.status === "ready" && state.reports.length > 0 && (
        <ul className="grid gap-4 text-sm">
          {state.reports
            .toSorted(
              (a, b) => reportTypeRank(a.testType) - reportTypeRank(b.testType),
            )
            .map((r) => (
              <li key={r.id} className="grid gap-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-medium">
                    {reportTypeLabel(r.testType, r.title)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    #{r.publicId}
                    {r.labId && labs[r.labId] && ` · ${labs[r.labId]}`} ·{" "}
                    {r.testedAt
                      ? `tested ${shortDate(r.testedAt)}`
                      : "no test date"}
                  </span>
                </div>
                <ReportLink report={r} />
                <ReportSamples report={r} assays={assays} />
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

// Where this report lives on the lab's own site. Saved here, it shows on
// the store's repository as a link customers can check the report against.
function ReportLink({ report }: { report: LabReport }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(report.resultUrl ?? "");
  const [value, setValue] = useState(report.resultUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const changed = value.trim() !== saved;
  const link = httpsLink(saved);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await updateReportLink(report.id, value);
      if (result.ok) {
        setSaved(result.resultUrl ?? "");
        setValue(result.resultUrl ?? "");
      } else setError(result.error);
    });
  }

  return (
    <form action={submit} className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          inputMode="url"
          aria-label={`Link to the ${reportTypeLabel(report.testType, report.title)} report on the lab's site`}
          placeholder="https://… this report on the lab's site"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 bg-background text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending || !changed}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        {link && !changed && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs whitespace-nowrap text-muted-foreground hover:underline"
          >
            Open
          </a>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
