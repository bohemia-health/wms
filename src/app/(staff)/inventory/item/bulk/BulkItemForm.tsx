"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckIcon,
  CircleAlertIcon,
  ClipboardCopyIcon,
  UploadIcon,
} from "lucide-react";

import { createItems } from "./actions";
import { COLUMNS, parseSheet } from "./parse";
import type { Vendor } from "../types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const EXAMPLE = [
  COLUMNS.join(","),
  "RE,Retatrutide,10,injectable,Uther Pharmaceuticals,85.00,100,,32.50",
  "RE,Retatrutide,30,injectable,Uther Pharmaceuticals,150.00,100,RE30-0115,61.00",
].join("\n");

// Paste a sheet or pick a .csv, see every line checked, then add them all
// in one go. The preview is the contract: what it shows as valid is exactly
// what gets sent.
export function BulkItemForm({
  forms,
  vendors,
}: {
  forms: string[];
  vendors: Vendor[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(new Map());

  const rows = useMemo(
    () => parseSheet(text, { forms, vendors }),
    [text, forms, vendors],
  );
  const valid = rows.filter((r) => r.item !== null);
  const invalid = rows.length - valid.length;

  async function pickFile(file: File | undefined) {
    if (file) setText(await file.text());
  }

  function submit() {
    setError(null);
    setRowErrors(new Map());
    startTransition(async () => {
      const result = await createItems(valid.map((r) => r.item!));
      if (result.ok) {
        router.push("/inventory");
        return;
      }
      setError(result.error);
      if (result.rows) {
        // The API counts rows in the order sent, which is the valid rows.
        setRowErrors(
          new Map(result.rows.map((e) => [valid[e.row]?.line ?? -1, e.error])),
        );
      }
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sheet</CardTitle>
          <CardDescription>
            One item per line, columns in this order:{" "}
            <code className="font-mono text-xs">{COLUMNS.join(", ")}</code>.
            A header line is optional. Leave batch blank to number it from
            the code, size and today&rsquo;s date; unit is our cost per unit
            and may be left blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE}
            spellCheck={false}
            className="min-h-44 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Label htmlFor="bulk-file" />}
            >
              <UploadIcon data-icon="inline-start" />
              Choose .csv
            </Button>
            <input
              id="bulk-file"
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setText(EXAMPLE)}
            >
              <ClipboardCopyIcon data-icon="inline-start" />
              Use example
            </Button>
            <p className="ml-auto text-xs text-muted-foreground">
              Vendors:{" "}
              {vendors.map((v) => v.shortName ?? v.name).join(", ") || "none"}
            </p>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Preview
              <span className="pl-2 text-sm font-normal text-muted-foreground tabular-nums">
                {valid.length} ready
                {invalid > 0 && ` · ${invalid} with problems`}
              </span>
            </h2>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">Line</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const serverError = rowErrors.get(row.line);
                  const problems = serverError
                    ? [serverError, ...row.errors]
                    : row.errors;
                  const bad = problems.length > 0;
                  return (
                    <TableRow
                      key={row.line}
                      className={bad ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                    >
                      <TableCell className="text-muted-foreground tabular-nums">
                        {row.line}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">
                            {row.raw[1] || <span className="text-muted-foreground">—</span>}
                          </span>
                          {row.raw[2] && (
                            <span className="text-muted-foreground tabular-nums">
                              {row.raw[2]} mg
                            </span>
                          )}
                          {row.raw[0] && (
                            <Badge variant="outline" className="font-mono">
                              {row.raw[0].toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        {bad && (
                          <p className="mt-1 text-xs text-destructive">
                            {problems.join("; ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {row.raw[3] || "—"}
                      </TableCell>
                      <TableCell>{row.raw[4] || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.item
                          ? currency.format(Number(row.item.price))
                          : row.raw[5] || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.item?.unitPrice
                          ? currency.format(Number(row.item.unitPrice))
                          : row.raw[8] || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.raw[6] || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.item?.batchNumber ?? row.raw[7] ?? "—"}
                      </TableCell>
                      <TableCell>
                        {bad ? (
                          <CircleAlertIcon className="size-4 text-destructive" />
                        ) : (
                          <CheckIcon className="size-4 text-emerald-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {invalid > 0 && !error && (
              <p className="text-sm text-muted-foreground">
                Fix the {invalid} flagged {invalid === 1 ? "line" : "lines"} or
                remove them; only valid lines are added.
              </p>
            )}
            <Button
              type="button"
              onClick={submit}
              disabled={pending || valid.length === 0}
            >
              {pending
                ? "Adding…"
                : `Add ${valid.length} ${valid.length === 1 ? "item" : "items"}`}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
