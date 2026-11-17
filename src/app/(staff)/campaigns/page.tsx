import Link from "next/link";
import { headers } from "next/headers";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shortDate } from "@/lib/format";
import { NewCampaign } from "./NewCampaign";
import { STATUS_LABELS, type Campaign } from "./types";

export const instant = false;

export default async function Page() {
  // Asclepius asks for a session on this route, so the cookie goes along.
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`campaigns answered ${res.status}`);
  const campaigns: Campaign[] = await res.json();

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Group buys and the items offered in each. Select one to see its
            items.
          </p>
        </div>
        <NewCampaign />
      </header>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Closes</TableHead>
              <TableHead>Ships in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No campaigns yet.
                </TableCell>
              </TableRow>
            )}
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  <div className="text-xs text-muted-foreground tabular-nums">#{c.id}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={c.status?.toUpperCase()}
                    label={c.status ? STATUS_LABELS[c.status] : undefined}
                  />
                </TableCell>
                <TableCell>{shortDate(c.opens_at)}</TableCell>
                <TableCell>{shortDate(c.closes_at)}</TableCell>
                <TableCell>
                  {c.ships_in_min && c.ships_in_max
                    ? `${c.ships_in_min}-${c.ships_in_max} weeks`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
