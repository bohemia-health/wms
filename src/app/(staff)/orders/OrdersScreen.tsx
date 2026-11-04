import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { daysAgo, money } from "@/lib/format";
import { OrdersTable } from "./OrdersTable";
import type { Courier, OrderRow } from "./types";

const WORKING = new Set(["RECEIVED", "OPEN", "ACTION_REQUIRED"]);
const MOVING = new Set(["SHIPPED", "IN_TRANSIT", "DELAYED"]);

export function OrdersScreen({ orders, couriers }: { orders: OrderRow[]; couriers: Courier[] }) {
  const toWork = orders.filter((o) => WORKING.has(o.status));
  const needsAction = orders.filter((o) => o.status === "ACTION_REQUIRED").length;
  const moving = orders.filter((o) => MOVING.has(o.status)).length;
  const since = daysAgo(30);
  const recent = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= since && o.status !== "CANCELLED",
  );
  const revenue = recent.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Everything customers have bought, newest first. Select an order to
          see its lines, addresses and shipments, and to move it along.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        <Card>
          <CardHeader>
            <CardDescription>To work</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {toWork.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {needsAction > 0
                ? `${needsAction} ${needsAction === 1 ? "needs" : "need"} action`
                : "received or open"}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>On the way</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {moving}
            </CardTitle>
            <p className="text-sm text-muted-foreground">shipped or in transit</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last 30 days</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {money(revenue)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              across {recent.length} {recent.length === 1 ? "order" : "orders"}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>All time</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {orders.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {orders.filter((o) => o.status === "COMPLETED").length} completed
            </p>
          </CardHeader>
        </Card>
      </section>

      <OrdersTable orders={orders} couriers={couriers} />
    </main>
  );
}
