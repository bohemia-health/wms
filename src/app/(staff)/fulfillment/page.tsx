import { ArrowDownToLine, Package } from "lucide-react";
import { FulfillmentBar } from "./FulfillmentBar";
import { FulfillmentScreen } from "./FulfillmentScreen";

export const instant = false;

const queues = [
  { key: "receiving", name: "Receiving", icon: ArrowDownToLine },
  { key: "packing", name: "Packing", icon: Package },
] as const;

export default async function Page({ searchParams }: PageProps<"/fulfillment">) {
  const { queue } = await searchParams;
  const selected = queues.find(({ key }) => key === queue);
  if (selected) return <FulfillmentScreen queue={selected.name} />;

  return (
    <main className="flex min-h-dvh flex-col bg-white text-zinc-950">
      <FulfillmentBar />
      <section aria-labelledby="department-heading" className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-3xl text-center">
          <h1 id="department-heading" className="text-4xl font-medium tracking-tight sm:text-5xl">
            Select Department
          </h1>
          <form action="/fulfillment" method="get" className="mt-10 sm:mt-12">
            <div
              role="group"
              aria-labelledby="department-heading"
              className="grid grid-cols-2 divide-x divide-zinc-300 rounded-xl border border-zinc-300 bg-white"
            >
              {queues.map(({ key, name, icon: Icon }) => (
                <button
                  key={key}
                  type="submit"
                  name="queue"
                  value={key}
                  className="inline-flex min-h-32 min-w-0 cursor-pointer flex-col items-center justify-center gap-3 px-3 py-7 text-2xl font-medium tracking-tight first:rounded-l-xl last:rounded-r-xl hover:bg-zinc-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 active:bg-zinc-100 sm:min-h-40 sm:flex-row sm:gap-4 sm:px-8 sm:text-3xl"
                >
                  <Icon aria-hidden="true" className="size-8 shrink-0" strokeWidth={1.6} />
                  {name}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
