// Everything that talks to a Niimbot label printer lives in this file.
//
// The printer is reached straight from the browser over Bluetooth, through
// @mmote/niimbluelib: an unofficial, community-made implementation of
// Niimbot's protocol, pinned to one exact version in package.json. Nothing
// else in the app imports that library, so if it ever breaks or is
// replaced, this file is the only place that changes.
//
// Browser only (Chrome or Edge, on https or localhost), and the first
// connection must come from a click: the browser shows its own device
// picker and will not open it any other way.
import type { NiimbotBluetoothClient } from "@mmote/niimbluelib";

export type ConnectedPrinter = {
  // What the printer calls itself over Bluetooth, e.g. "M3-G123456789".
  name: string;
  model: string;
  dpi: number;
  // How many dots wide the print head is: the widest image it can print.
  printheadDots: number;
};

let client: NiimbotBluetoothClient | null = null;
let connected: ConnectedPrinter | null = null;

// The library is loaded only when a printer is first used, so it stays out
// of every other screen's bundle and never runs on the server.
const lib = () => import("@mmote/niimbluelib");

export const printingSupported = () =>
  typeof navigator !== "undefined" && "bluetooth" in navigator;

// The connected printer is shared by every screen that prints, so it is
// kept here and screens subscribe to it (React: useSyncExternalStore).
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export const currentPrinter = () => connected;

export function subscribePrinter(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Open the browser's device picker and connect to the printer the person
// chooses. If the printer later drops (switched off, out of range, opened
// in another app) subscribers are told and currentPrinter() goes null.
export async function connectPrinter(): Promise<ConnectedPrinter> {
  if (!printingSupported()) {
    throw new Error("This browser cannot reach a printer. Use Chrome or Edge.");
  }
  await disconnectPrinter();
  const { NiimbotBluetoothClient } = await lib();
  const c = new NiimbotBluetoothClient();
  c.on("disconnect", () => {
    if (client !== c) return;
    client = null;
    connected = null;
    changed();
  });

  const info = await c.connect();
  const meta = c.getModelMetadata();
  if (!meta || !c.getPrintTaskType()) {
    await c.disconnect().catch(() => {});
    throw new Error(
      `Connected to ${info.deviceName ?? "the printer"}, but its model is not one this app knows how to print to.`,
    );
  }
  client = c;
  connected = {
    name: info.deviceName ?? meta.model,
    model: meta.model,
    dpi: meta.dpi,
    printheadDots: meta.printheadPixels,
  };
  changed();
  return connected;
}

export async function disconnectPrinter() {
  const c = client;
  if (!c) return;
  client = null;
  connected = null;
  changed();
  if (c.isConnected()) await c.disconnect().catch(() => {});
}

// Print one canvas as a label. The canvas must already be at the printer's
// dot size (see currentPrinter().dpi) and drawn as the label is read; every
// pixel is printed as either a dot or nothing. Resolves when the printer
// reports the label is out; rejects with the printer's own reason (cover
// open, out of labels) when it cannot print.
export async function printCanvas(
  canvas: HTMLCanvasElement,
  { copies = 1, onProgress }: { copies?: number; onProgress?: (percent: number) => void } = {},
) {
  const c = client;
  if (!c?.isConnected() || !connected) throw new Error("No printer is connected.");
  const meta = c.getModelMetadata();
  const taskName = c.getPrintTaskType();
  if (!meta || !taskName) throw new Error("The connected printer cannot be printed to.");

  // The label is fed either top first or left edge first; the side that
  // lies across the print head is the one that must fit it.
  const across = meta.printDirection === "left" ? canvas.height : canvas.width;
  if (across > meta.printheadPixels) {
    throw new Error(`The label is ${across} dots wide; this printer prints up to ${meta.printheadPixels}.`);
  }

  const { ImageEncoder, LabelType, PageColorType } = await lib();
  const image = ImageEncoder.encodeCanvas(canvas, PageColorType.SingleColor, meta.printDirection);
  const task = c.protocol.newPrintTask(taskName, {
    totalPages: copies,
    density: meta.densityDefault,
    labelType: LabelType.WithGaps,
    pageColor: PageColorType.SingleColor,
  });

  const progress = (e: { pagePrintProgress: number }) => onProgress?.(e.pagePrintProgress);
  c.on("printprogress", progress);
  try {
    await task.printInit();
    await task.printPage(image, copies);
    await task.waitForPageFinished();
    await task.waitForFinished();
  } finally {
    c.off("printprogress", progress);
    // Always close the job, or the printer stays busy and refuses the next.
    await task.printEnd().catch(() => {});
  }
}
