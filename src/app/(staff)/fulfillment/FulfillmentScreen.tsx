import Image from "next/image";
import { ScanBarcode } from "lucide-react";
import { FulfillmentBar } from "./FulfillmentBar";

export function FulfillmentScreen({ queue }: { queue: string }) {
  return (
    <main className="flex min-h-dvh w-full flex-col bg-white text-zinc-950">
      <FulfillmentBar queue={queue} />

      <section aria-labelledby="item-name" className="bg-[#dfe3fc]">
        <div className="mx-auto grid max-w-[100rem] grid-cols-[clamp(5rem,24vw,24rem)_minmax(0,1fr)] items-stretch gap-x-[clamp(1rem,4vw,4rem)] px-[clamp(1rem,3.2vw,3.25rem)] py-[clamp(1.5rem,2.65vw,2.75rem)]">
          <div className="flex min-h-28 items-center justify-center self-center overflow-hidden rounded-xl bg-[#e1e1e3] sm:aspect-[8/5] sm:rounded-2xl">
            <Image
              src="/sample/mito-vial.png"
              alt="Sample vial"
              width={110}
              height={242}
              sizes="(min-width: 1600px) 88px, (min-width: 640px) 5.5vw, 40px"
              className="h-auto w-10 sm:w-[23%]"
              priority
            />
          </div>
          <div className="flex flex-col justify-between gap-6">
            <h1 id="item-name" className="text-[clamp(1.125rem,2.15vw,2.15rem)] leading-[1.24] font-medium tracking-[-0.02em] text-pretty">
              Uther Pharmaceuticals BPC-157 10mg Pink Vial Cap Brown Vial Crimp{" "}
              <span className="whitespace-nowrap">BP10-0723</span>
            </h1>
            <p className="text-[clamp(1.75rem,3.75vw,3.75rem)] leading-none font-medium tracking-tight tabular-nums">
              QTY: 1
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="scan-heading"
        className="flex flex-1 flex-col items-center px-4 pt-[clamp(2.5rem,6vh,4.5rem)] pb-10 text-center"
      >
        <h2 id="scan-heading" className="text-[clamp(2rem,4.8vw,4.75rem)] leading-[1.05] font-medium tracking-[-0.035em]">
          Scan Item Barcode
        </h2>
        <div className="flex flex-1 items-center justify-center py-10">
          <ScanBarcode
            aria-hidden="true"
            strokeWidth={1.15}
            className="size-[clamp(4.5rem,8vw,8rem)] text-zinc-700"
          />
        </div>
      </section>
    </main>
  );
}
