import { headers } from "next/headers";
import { QueueOrder } from "./types";
import { FulfillmentScreen } from "./FulfillmentScreen";
export const instant = false;

export default async function Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [res] = await Promise.all([
    fetch(`${api}/fulfillment/queue`, {
      headers: { cookie },
      cache: "no-store",
    }),
  ]);

  if (!res.ok) throw new Error(`/fulfillment/queue answered ${res.status}`);
  const queue: QueueOrder[] = await res.json();

  return <FulfillmentScreen queue={queue} />;
}
