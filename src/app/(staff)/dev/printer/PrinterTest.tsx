"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BluetoothIcon, BluetoothOffIcon, PrinterIcon, RefreshCwIcon } from "lucide-react";
import {
  CONTAINER_LABEL_MM,
  drawContainerLabel,
  type ContainerLabel,
} from "@/lib/container-label";
import {
  connectPrinter,
  currentPrinter,
  disconnectPrinter,
  printCanvas,
  printingSupported,
  subscribePrinter,
} from "@/lib/niimbot";
import { getSampleLabel } from "./actions";

type Busy = "connecting" | "printing" | "loading" | null;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Connect to the printer, then print a container label the API made. The
// label on screen is the exact bitmap that goes to the print head.
export function PrinterTest() {
  // Whether this browser can reach a printer is only known in the browser;
  // the server render assumes it can, so the warning never flashes.
  const supported = useSyncExternalStore(() => () => {}, printingSupported, () => true);
  // The connection lives in the printer module, so it survives moving
  // between screens and this page simply reflects it.
  const printer = useSyncExternalStore(subscribePrinter, currentPrinter, () => null);
  const [label, setLabel] = useState<ContainerLabel | null>(null);
  const [busy, setBusy] = useState<Busy>("loading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [printed, setPrinted] = useState<string | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);

  function showLabel(result: Awaited<ReturnType<typeof getSampleLabel>>) {
    if (result.ok) setLabel(result.label);
    else setError(result.error);
    setBusy(null);
  }

  // The first label, fetched once the page is up.
  useEffect(() => {
    let live = true;
    void getSampleLabel().then((result) => {
      if (live) showLabel(result);
    });
    return () => {
      live = false;
    };
  }, []);

  // Redraw the preview whenever the label or the printer's resolution
  // changes. Before a printer is connected it is drawn at 300 dpi.
  const dpi = printer?.dpi ?? 300;
  useEffect(() => {
    const target = preview.current;
    if (!target || !label) return;
    const drawn = drawContainerLabel(label, dpi);
    target.width = drawn.width;
    target.height = drawn.height;
    target.getContext("2d")?.drawImage(drawn, 0, 0);
  }, [label, dpi]);

  async function loadLabel() {
    setBusy("loading");
    setError(null);
    setPrinted(null);
    showLabel(await getSampleLabel());
  }

  async function connect() {
    setBusy("connecting");
    setError(null);
    try {
      await connectPrinter();
    } catch (e) {
      // Closing the browser's device picker is not an error worth showing.
      if (!/cancel/i.test(message(e))) setError(message(e));
    }
    setBusy(null);
  }

  const disconnect = () => disconnectPrinter();

  async function print() {
    if (!label || !printer) return;
    setBusy("printing");
    setError(null);
    setPrinted(null);
    setProgress(0);
    try {
      await printCanvas(drawContainerLabel(label, printer.dpi), { onProgress: setProgress });
      setPrinted(label.code);
    } catch (e) {
      setError(message(e));
    }
    setBusy(null);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Label printer test</h1>
          <Badge variant="outline" className="text-muted-foreground">
            Development only
          </Badge>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          Connect to the Niimbot over Bluetooth and print a container label
          without a print dialog. The code is a throwaway: it is not saved and
          belongs to no shipment.
        </p>
      </header>

      {!supported && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          This browser cannot reach a Bluetooth printer. Open this page in
          Chrome or Edge.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardDescription>Step 1</CardDescription>
            <CardTitle className="flex items-center gap-2 text-base">
              {printer ? (
                <BluetoothIcon className="size-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <BluetoothOffIcon className="size-4 text-muted-foreground" />
              )}
              {printer ? printer.name : "No printer connected"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {printer ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Model</dt>
                <dd>{printer.model}</dd>
                <dt className="text-muted-foreground">Resolution</dt>
                <dd className="tabular-nums">{printer.dpi} dpi</dd>
                <dt className="text-muted-foreground">Widest label</dt>
                <dd className="tabular-nums">
                  {Math.floor((printer.printheadDots / printer.dpi) * 25.4)} mm
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Switch the printer on and quit the Niimbot app first: the
                printer talks to one thing at a time. The browser will show
                its own list to pick from.
              </p>
            )}
            <div>
              {printer ? (
                <Button variant="outline" onClick={disconnect} disabled={busy !== null}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connect} disabled={!supported || busy !== null}>
                  <BluetoothIcon data-icon="inline-start" />
                  {busy === "connecting" ? "Connecting…" : "Connect printer"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Step 2</CardDescription>
            <CardTitle className="text-base">
              Container label, {CONTAINER_LABEL_MM.width} × {CONTAINER_LABEL_MM.height} mm
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid place-items-center rounded-md bg-muted p-6">
              <canvas
                ref={preview}
                aria-label={label ? `Label ${label.code}` : "Label preview"}
                className="h-auto w-full max-w-sm rounded-sm bg-white shadow-sm ring-1 ring-border"
                style={{ aspectRatio: `${CONTAINER_LABEL_MM.width} / ${CONTAINER_LABEL_MM.height}` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={print} disabled={!printer || !label || busy !== null}>
                <PrinterIcon data-icon="inline-start" />
                {busy === "printing" ? `Printing… ${progress}%` : "Print test label"}
              </Button>
              <Button variant="outline" onClick={loadLabel} disabled={busy !== null}>
                <RefreshCwIcon data-icon="inline-start" />
                New code
              </Button>
              {label && (
                <span className="font-mono text-xs text-muted-foreground">{label.code}</span>
              )}
            </div>
            {!printer && (
              <p className="text-sm text-muted-foreground">
                Connect the printer to print. Load {CONTAINER_LABEL_MM.width} ×{" "}
                {CONTAINER_LABEL_MM.height} mm labels.
              </p>
            )}
            {printed && (
              <p className="text-sm text-emerald-700 dark:text-emerald-500" role="status">
                Printed {printed}. Scan it with your phone: it should read back
                the same code.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
