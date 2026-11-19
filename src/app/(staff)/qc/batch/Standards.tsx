"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStandard } from "./actions";
import type { Assay } from "./types";

const label = (a: Assay) =>
  a.default_unit ? `${a.name} (${a.default_unit})` : a.name;

// What each test's readings are held to. A reading is judged against these
// every time it is shown, so a change here re-judges every vial on file.
// A test with nothing set is recorded but never flagged.
export function Standards({ assays }: { assays: Assay[] }) {
  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
        Test standards
        <span className="pl-2 font-normal text-muted-foreground">
          what counts as a pass for each test
        </span>
      </summary>
      <ul className="grid gap-3 border-t px-4 py-4">
        {assays.length === 0 && (
          <li className="text-sm text-muted-foreground">
            No tests to show. Your role may not be able to read them.
          </li>
        )}
        {assays.map((a) => (
          <li key={a.assay_def_id}>
            <StandardRow assay={a} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function StandardRow({ assay }: { assay: Assay }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [min, setMin] = useState(
    assay.spec_min === null ? "" : String(Number(assay.spec_min)),
  );
  const [max, setMax] = useState(
    assay.spec_max === null ? "" : String(Number(assay.spec_max)),
  );
  const [expected, setExpected] = useState(assay.spec_expected ?? "");
  const [vsLabel, setVsLabel] = useState(assay.spec_vs_label);
  const id = `standard-${assay.assay_def_id}`;
  const numeric =
    assay.result_type === "numeric" || assay.result_type === "bounded_numeric";

  function submit() {
    setError(null);
    setSaved(false);
    const limit = (text: string) => (text.trim() === "" ? null : Number(text));
    const low = limit(min);
    const high = limit(max);
    if (
      (low !== null && !Number.isFinite(low)) ||
      (high !== null && !Number.isFinite(high))
    ) {
      return setError("Limits must be numbers.");
    }
    startTransition(async () => {
      const result = await updateStandard(
        assay.assay_def_id,
        numeric
          ? { specMin: low, specMax: high, specVsLabel: vsLabel }
          : { specExpected: expected.trim() || null },
      );
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  if (assay.result_type === "structured_list") {
    return (
      <div className="flex flex-wrap items-baseline gap-x-4 text-sm">
        <span className="w-44 font-medium">{label(assay)}</span>
        <span className="text-muted-foreground">
          A list of entries; recorded, not judged.
        </span>
      </div>
    );
  }

  return (
    <form
      action={submit}
      className="flex flex-wrap items-end gap-x-4 gap-y-2 text-sm"
    >
      <span className="w-44 pb-1.5 font-medium">{label(assay)}</span>
      {numeric ? (
        <>
          <div className="grid gap-1">
            <Label htmlFor={`${id}-min`} className="text-xs">
              At least
            </Label>
            <Input
              id={`${id}-min`}
              inputMode="decimal"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="no minimum"
              className="h-8 w-28 text-xs tabular-nums"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`${id}-max`} className="text-xs">
              At most
            </Label>
            <Input
              id={`${id}-max`}
              inputMode="decimal"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="no limit"
              className="h-8 w-28 text-xs tabular-nums"
            />
          </div>
          <label className="flex items-center gap-2 pb-1.5 text-xs">
            <input
              type="checkbox"
              checked={vsLabel}
              onChange={(e) => setVsLabel(e.target.checked)}
            />
            Must reach the batch&rsquo;s label amount
          </label>
        </>
      ) : (
        <div className="grid gap-1">
          <Label htmlFor={`${id}-expected`} className="text-xs">
            Must be reported as
          </Label>
          <Input
            id={`${id}-expected`}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="not judged"
            className="h-8 w-28 text-xs"
          />
        </div>
      )}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {saved && (
        <span className="pb-1.5 text-xs text-muted-foreground">Saved</span>
      )}
      {error && (
        <span className="pb-1.5 text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
