import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";

// One colour vocabulary for every status in the wms, so a reader learns it
// once: grey is waiting, blue is moving, amber needs a person, green is done,
// red went wrong.
const TONES: Record<string, string> = {
  // orders
  RECEIVED: "bg-muted text-foreground",
  OPEN: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SHIPPED: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  CANCELLED: "bg-destructive/10 text-destructive",
  ACTION_REQUIRED: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  // shipments
  PRE_FILED: "bg-muted text-foreground",
  IN_TRANSIT: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  RELEASED_TO_CARRIER: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  CLEARED: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  AWAITING_CLEARANCE: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  IN_INSPECTION: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  PGA_HOLD: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  DUTY_PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  DELAYED: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  STATUS_UNKNOWN: "bg-muted text-muted-foreground",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-destructive/10 text-destructive",
  RETURNED: "bg-destructive/10 text-destructive",
  // verification
  "PENDING VERIFICATION": "bg-muted text-muted-foreground",
  VERIFIED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  DISCREPANCY_SHORTAGE: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  DISCREPANCY_OVERAGE: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  DAMAGED: "bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge
      variant="secondary"
      className={cn("capitalize", TONES[status] ?? "", className)}
    >
      {humanize(status)}
    </Badge>
  );
}
