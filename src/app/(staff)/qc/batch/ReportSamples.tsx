"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeSample, reportSamples, saveSample } from "./actions";
import { assaysFor } from "./report-type";
import type { Assay, LabReport, ReportSample, SampleResult } from "./types";

const QUALIFIERS = ["<", "<=", "=", ">=", ">"];
// Plain controls, styled to sit beside the Input component.
const control =
  "h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown) =>
  typeof v === "string" || typeof v === "number" ? String(v) : "";

// Two tests can share a name and differ only in unit (endotoxin per vial
// and per mL), so the unit is part of the label wherever there is one.
const assayLabel = (a: { name: string; default_unit: string | null }) =>
  a.default_unit ? `${a.name} (${a.default_unit})` : a.name;

// One reading in a few words, for the list of vials.
function summary(r: SampleResult): string {
  const label = assayLabel({ name: r.assay, default_unit: r.defaultUnit });
  if (!isRecord(r.result)) return label;
  if (r.resultType === "structured_list") {
    const n = Array.isArray(r.result.items) ? r.result.items.length : 0;
    return `${r.assay}: ${n} ${n === 1 ? "entry" : "entries"}`;
  }
  if (r.resultType === "enum") return `${r.assay}: ${text(r.result.value)}`;
  const unit = text(r.result.unit) || r.defaultUnit || "";
  const qualifier =
    r.resultType === "bounded_numeric" ? `${text(r.result.qualifier)} ` : "";
  return `${r.assay}: ${qualifier}${text(r.result.value)}${unit ? ` ${unit}` : ""}`;
}

// A reading with its verdict. One that misses its standard is in the
// warning colour with the reason spelled out; one that cannot be judged yet
// says what is missing, so a gap never reads as a pass.
function Reading({ result }: { result: SampleResult }) {
  const verdict = result.verdict;
  if (!verdict || verdict.status === "pass") {
    return (
      <span>
        {summary(result)}
        {verdict && <span className="sr-only"> (meets its standard)</span>}
      </span>
    );
  }
  return (
    <span
      className={
        verdict.status === "flag"
          ? "font-medium text-destructive"
          : "text-amber-700 dark:text-amber-400"
      }
    >
      {summary(result)}
      {verdict.status === "flag" ? " — " : " — not judged: "}
      {verdict.reason}
    </span>
  );
}

// What the form holds for one test, as the text in its boxes.
type Field = { value: string; qualifier: string };

// A list result as lines of "name, value, unit", the way it is typed.
function listToLines(result: unknown): string {
  if (!isRecord(result) || !Array.isArray(result.items)) return "";
  return (result.items as unknown[])
    .filter(isRecord)
    .map((i) =>
      [text(i.name), text(i.value), text(i.unit)].filter(Boolean).join(", "),
    )
    .join("\n");
}

function fieldsOf(
  assays: Assay[],
  sample: ReportSample | null,
): Record<number, Field> {
  return Object.fromEntries(
    assays.map((a) => {
      const found = sample?.results.find(
        (r) => r.assayDefId === a.assay_def_id,
      );
      const result = found && isRecord(found.result) ? found.result : null;
      return [
        a.assay_def_id,
        {
          value:
            a.result_type === "structured_list"
              ? listToLines(result)
              : text(result?.value),
          qualifier: text(result?.qualifier) || "<",
        },
      ];
    }),
  );
}

// The body's result for one test: the reading, or null for a blank box,
// which clears a reading already on file.
function resultOf(a: Assay, f: Field): unknown {
  const value = f.value.trim();
  if (!value) return null;
  if (a.result_type === "numeric") return { value };
  if (a.result_type === "bounded_numeric")
    return { qualifier: f.qualifier, value };
  if (a.result_type === "enum") return { value };
  return {
    items: value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, reading, unit] = line
          .split(",")
          .map((part) => part.trim());
        return { name, value: reading ?? "", ...(unit ? { unit } : {}) };
      }),
  };
}

// The vials a report covers and what was measured on each. A vial is one
// sample: pulled from one kit, sent to this report's lab and used up there.
export function ReportSamples({
  report,
  assays,
}: {
  report: LabReport;
  assays: Assay[];
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "ready"; samples: ReportSample[] }
  >({ status: "loading" });
  // "new" while adding a vial, a sample id while correcting one.
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fields = assaysFor(report.testType, assays);

  useEffect(() => {
    let current = true;
    reportSamples(report.id).then((result) => {
      if (!current) return;
      setState(
        result.ok
          ? { status: "ready", samples: result.samples }
          : { status: "error", error: result.error },
      );
    });
    return () => {
      current = false;
    };
  }, [report.id]);

  function remove(sample: ReportSample) {
    setError(null);
    startTransition(async () => {
      const result = await removeSample(report.id, sample.id);
      if (!result.ok) return setError(result.error);
      setState((s) =>
        s.status === "ready"
          ? {
              status: "ready",
              samples: s.samples.filter((x) => x.id !== sample.id),
            }
          : s,
      );
    });
  }

  function saved(sample: ReportSample) {
    setEditing(null);
    setState((s) =>
      s.status === "ready"
        ? {
            status: "ready",
            samples: [
              ...s.samples.filter((x) => x.id !== sample.id),
              sample,
            ].sort((a, b) =>
              a.code.localeCompare(b.code, undefined, { numeric: true }),
            ),
          }
        : s,
    );
  }

  if (state.status === "loading") {
    return <p className="text-xs text-muted-foreground">Loading samples…</p>;
  }
  if (state.status === "error") {
    return (
      <p className="text-xs text-destructive" role="alert">
        {state.error}
      </p>
    );
  }

  return (
    <div className="grid gap-2 rounded-md border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium">
          Samples
          <span className="pl-1.5 font-normal text-muted-foreground tabular-nums">
            {state.samples.length}
          </span>
        </h4>
        {editing === null && (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            Add sample
          </Button>
        )}
      </div>

      {state.samples.length === 0 && editing === null && (
        <p className="text-xs text-muted-foreground">
          No vials recorded for this report yet.
        </p>
      )}

      <ul className="grid gap-2">
        {state.samples.map((s) =>
          editing === s.id ? (
            <li key={s.id}>
              <SampleForm
                report={report}
                fields={fields}
                sample={s}
                onSaved={saved}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={s.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs"
            >
              <span className="font-mono font-medium">{s.code}</span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                {s.results.length === 0 && "no results entered"}
                {s.results.map((r) => (
                  <Reading key={r.assayDefId} result={r} />
                ))}
              </span>
              <span className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || editing !== null}
                  onClick={() => setEditing(s.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || editing !== null}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (
                      window.confirm(`Remove sample ${s.code} and its results?`)
                    )
                      remove(s);
                  }}
                >
                  Remove
                </Button>
              </span>
            </li>
          ),
        )}
      </ul>

      {editing === "new" && (
        <SampleForm
          report={report}
          fields={fields}
          sample={null}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// One vial: a box per test this kind of report
// carries. A blank box means no reading; on a vial already on file it
// clears the one there.
function SampleForm({
  report,
  fields,
  sample,
  onSaved,
  onCancel,
}: {
  report: LabReport;
  fields: Assay[];
  sample: ReportSample | null;
  onSaved: (sample: ReportSample) => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState(() => fieldsOf(fields, sample));
  const key = `${report.id}-${sample?.id ?? "new"}`;

  const set = (id: number, patch: Partial<Field>) =>
    setValues((v) => ({ ...v, [id]: { ...v[id], ...patch } }));

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveSample(report.id, {
        ...(sample ? { sampleId: sample.id } : {}),
        results: fields.map((a) => ({
          assayDefId: a.assay_def_id,
          result: resultOf(a, values[a.assay_def_id]),
        })),
      });
      if (result.ok) onSaved(result.sample);
      else setError(result.error);
    });
  }

  return (
    <form
      action={submit}
      className="grid gap-3 rounded-md border bg-background p-3"
    >
      <p className="text-xs font-medium">
        {sample ? `Sample ${sample.code}` : "New sample"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((a) => {
          const id = `assay-${key}-${a.assay_def_id}`;
          const f = values[a.assay_def_id];
          return (
            <div
              key={a.assay_def_id}
              className={`grid gap-1.5 ${a.result_type === "structured_list" ? "sm:col-span-2" : ""}`}
            >
              <Label htmlFor={id} className="text-xs">
                {assayLabel(a)}
              </Label>
              {a.result_type === "numeric" && (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={f.value}
                  onChange={(e) =>
                    set(a.assay_def_id, { value: e.target.value })
                  }
                  className="h-8 text-xs tabular-nums"
                />
              )}
              {a.result_type === "bounded_numeric" && (
                <div className="flex gap-1.5">
                  <select
                    aria-label={`${assayLabel(a)} qualifier`}
                    value={f.qualifier}
                    onChange={(e) =>
                      set(a.assay_def_id, { qualifier: e.target.value })
                    }
                    className={control}
                  >
                    {QUALIFIERS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={f.value}
                    onChange={(e) =>
                      set(a.assay_def_id, { value: e.target.value })
                    }
                    className="h-8 text-xs tabular-nums"
                  />
                </div>
              )}
              {a.result_type === "enum" && (
                <select
                  id={id}
                  value={f.value}
                  onChange={(e) =>
                    set(a.assay_def_id, { value: e.target.value })
                  }
                  className={control}
                >
                  <option value="">Not recorded</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  {/* A word already on file that is neither, kept as it is. */}
                  {f.value && f.value !== "pass" && f.value !== "fail" && (
                    <option value={f.value}>{f.value}</option>
                  )}
                </select>
              )}
              {a.result_type === "structured_list" && (
                <>
                  <textarea
                    id={id}
                    rows={4}
                    value={f.value}
                    onChange={(e) =>
                      set(a.assay_def_id, { value: e.target.value })
                    }
                    placeholder={
                      "One per line: name, value, unit\nMain peak, 99.1, %"
                    }
                    className={`${control} h-auto py-1.5 font-mono`}
                  />
                  <p className="text-xs text-muted-foreground">
                    One entry per line, as name, value, unit. The unit is
                    optional.
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {error && (
          <p className="mr-auto text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : sample ? "Update sample" : "Add sample"}
        </Button>
      </div>
    </form>
  );
}
