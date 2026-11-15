import { notFound } from "next/navigation";
import { PrinterTest } from "./PrinterTest";

export const instant = false;

// A bench for trying the label printer, for development only: it is not in
// the sidebar and does not exist in a production build.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PrinterTest />;
}
