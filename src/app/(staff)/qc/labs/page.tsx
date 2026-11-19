import { ExternalLinkIcon } from "lucide-react";
import { headers } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { httpsLink } from "@/lib/https-link";
import type { Lab } from "../batch/types";

export const instant = false;

async function listLabs(): Promise<Lab[] | "forbidden" | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/labs`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) return "forbidden";
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const labs = await listLabs();

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Labs</h1>
        <p className="text-sm text-muted-foreground">Lab directory and verification websites.</p>
      </header>

      {Array.isArray(labs) ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="pl-4">Lab</TableHead>
                <TableHead scope="col">Verification website</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    No labs on file.
                  </TableCell>
                </TableRow>
              )}
              {labs.map((lab) => {
                const website = httpsLink(lab.verificationUrl);
                return (
                  <TableRow key={lab.id}>
                    <TableCell className="pl-4 font-medium">{lab.name ?? "Unnamed lab"}</TableCell>
                    <TableCell>
                      {website ? (
                        <a href={website} target="_blank" rel="noreferrer"
                           className={buttonVariants({ variant: "outline", size: "sm" })}>
                          {new URL(website).hostname} <ExternalLinkIcon />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No website on file</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p role="alert" className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
          {labs === "forbidden"
            ? "Your role does not have access to the lab directory."
            : "The lab directory is unavailable. Try again in a moment."}
        </p>
      )}
    </main>
  );
}
