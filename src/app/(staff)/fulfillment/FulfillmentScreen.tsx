import Image from "next/image";
import { QueueOrder } from "./types";
import { ScanBarcode } from "lucide-react";
import { FulfillmentBar } from "./FulfillmentBar";

export function FulfillmentScreen({ queue }: { queue: QueueOrder[] }) {
  const next = queue.find((o) => o.fillable === "yes") ?? null;
  const line = next?.lines[0] ?? null;

  return (
    <main className="flex min-h-dvh w-full flex-col">
      <FulfillmentBar />
      <section className="bg-blue-100 px-5 py-6 text-slate-950 sm:px-10 sm:py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 sm:gap-16 lg:gap-[clamp(6rem,12vw,14rem)]">
          <Image
            src="/sample/mito-vial.png"
            alt="Sample vial"
            width={110}
            height={242}
            sizes="(min-width: 640px) 76px, 48px"
            className="h-auto w-12 shrink-0 sm:w-19"
            priority
          />
          <div className="min-w-0 max-w-2xl space-y-4 sm:space-y-6">
            <h1 className="text-xl leading-tight font-medium text-pretty sm:text-3xl">
              Uther Pharmaceuticals BPC-157 10mg Pink Vial Cap Brown Vial Crimp{" "}
              <span className="whitespace-nowrap">BP10-0723</span>
            </h1>
            <p className="text-lg font-semibold sm:text-2xl">QTY: 1</p>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-10 text-center sm:gap-12">
        <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
          Scan Item Barcode
        </h2>
        <ScanBarcode
          aria-hidden="true"
          strokeWidth={1.25}
          className="size-16 text-muted-foreground sm:size-20"
        />
      </section>
    </main>
  );
}
