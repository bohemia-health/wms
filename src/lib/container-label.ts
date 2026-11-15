// The container label, drawn for a printer: the sticker the system prints
// for the box an order is packed into. Code 128 bars and the code in large
// type, on a 60 x 40 mm label, and nothing else.
//
// The API supplies the code and its bar widths (GET
// /staff/labels/container/sample today); this file turns them into a
// bitmap at the printer's own resolution. A printer can only print whole
// dots, so every bar here is a whole number of dots wide. Scaling a drawing
// to fit would leave bars a fraction of a dot off, which is what makes a
// small barcode scan badly.

export const CONTAINER_LABEL_MM = { width: 60, height: 40 };

export type ContainerLabel = {
  code: string;
  // Code 128 bar and space widths in modules, alternating, bar first.
  widths: string;
};

// The narrowest bar we aim for. Rounded to whole dots it is 3 dots
// (0.254 mm) at 300 dpi and 2 dots (0.25 mm) at 203 dpi.
const MODULE_MM = 0.26;
// Blank space required either side of the bars, in modules.
const QUIET_MODULES = 10;

export function drawContainerLabel(label: ContainerLabel, dpi: number): HTMLCanvasElement {
  const perMm = dpi / 25.4;
  const dots = (mm: number) => Math.round(mm * perMm);
  const canvas = document.createElement("canvas");
  canvas.width = dots(CONTAINER_LABEL_MM.width);
  canvas.height = dots(CONTAINER_LABEL_MM.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not draw the label.");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const moduleDots = Math.max(2, Math.round(MODULE_MM * perMm));
  const runs = [...label.widths].map(Number);
  const barsWidth = runs.reduce((sum, w) => sum + w, 0) * moduleDots;
  if (barsWidth + 2 * QUIET_MODULES * moduleDots > canvas.width) {
    throw new Error("The barcode does not fit this label.");
  }

  const top = dots(4);
  const barHeight = dots(22);
  let x = Math.round((canvas.width - barsWidth) / 2);
  ctx.fillStyle = "#000";
  runs.forEach((w, i) => {
    const run = w * moduleDots;
    if (i % 2 === 0) ctx.fillRect(x, top, run, barHeight);
    x += run;
  });

  const textSize = dots(5.4);
  ctx.font = `700 ${textSize}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // letterSpacing is recent; where it is missing the text is just tighter.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${dots(0.5)}px`;
  ctx.fillText(label.code, canvas.width / 2, top + barHeight + dots(7.2));

  // Text is drawn with soft grey edges, and a thermal head has no grey:
  // settle every pixel to black or white so the edges print cleanly.
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const dark = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < 128;
    px[i] = px[i + 1] = px[i + 2] = dark ? 0 : 255;
    px[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
