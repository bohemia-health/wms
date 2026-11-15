"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setCampaignStatus } from "../actions";
import { CAMPAIGN_STATUSES, STATUS_LABELS as LABELS, type CampaignStatus } from "../types";

export function StatusSelect({ id, status }: { id: string; status: CampaignStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: CampaignStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setCampaignStatus(id, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="grid gap-1">
      <Select
        value={status}
        onValueChange={(v) => change(v as CampaignStatus)}
        items={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: LABELS[s] }))}
        disabled={pending}
      >
        <SelectTrigger aria-label="Campaign status" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CAMPAIGN_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
