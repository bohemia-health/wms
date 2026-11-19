import Link from "next/link";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { httpsLink } from "@/lib/https-link";
import { reportTypeLabel } from "../qc/batch/report-type";

export const instant = false;

type Certificate = {
  id: string;
  title: string;
  displayTitle?: string;
  batchNumber: string;
  labName: string | null;
  testType: string | null;
  testedAt: string | null;
  fileKey: string;
  resultUrl: string | null;
};

const pageSize = 25;
const testDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

async function listCertificates(query: string): Promise<Certificate[] | null> {
  const params = new URLSearchParams(query ? { q: query } : {});
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coa?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const certificates: unknown = await response.json();
    return Array.isArray(certificates) ? certificates : null;
  } catch {
    return null;
  }
}

function certificateCopy(fileKey: string, batchNumber: string) {
  // The storefront already serves stored PDFs inline. Other formats can be
  // opened from the storefront's report list.
  const url = new URL("https://www.bhmhlth.com/repository");
  if (fileKey.toLowerCase().endsWith(".pdf")) {
    url.pathname += "/preview";
    url.searchParams.set("key", fileKey);
  } else {
    url.searchParams.set("q", batchNumber);
    url.hash = "lab-reports";
  }
  return url.href;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const certificates = await listCertificates(query);
  const sorted = certificates?.toSorted((a, b) =>
    (b.testedAt ?? "").localeCompare(a.testedAt ?? "") ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id),
  ) ?? [];
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const requested = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(requested)
    ? Math.min(pageCount, Math.max(1, requested))
    : 1;
  const rows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (next: number) => ({
    pathname: "/repository",
    query: { ...(query && { q: query }), page: next },
  });

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pb-10 lg:px-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Lab reports</h1>
        <p className="text-sm text-muted-foreground">
          Look up certificates of analysis by compound, batch, lab, or test.
        </p>
      </header>

      <form action="/repository" className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            key={query}
            type="search"
            name="q"
            aria-label="Search lab reports"
            placeholder="Compound, batch number, lab, or test"
            defaultValue={query}
          />
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
        </InputGroup>
        <Button type="submit">Search</Button>
        {query && (
          <Link href="/repository" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      {certificates === null ? (
        <p role="alert" className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
          Lab reports are unavailable. Try again in a moment.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="pl-4">Compound</TableHead>
                  <TableHead scope="col">Batch</TableHead>
                  <TableHead scope="col">Lab</TableHead>
                  <TableHead scope="col">Test</TableHead>
                  <TableHead scope="col">Tested</TableHead>
                  <TableHead scope="col" className="pr-4 text-right">Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {query ? "No lab reports match your search." : "No lab reports on file."}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((report) => {
                  const title = report.displayTitle ?? report.title;
                  const original = httpsLink(report.resultUrl);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="pl-4 font-medium">{title}</TableCell>
                      <TableCell>
                        <Link
                          href={{ pathname: "/qc/batch", query: { batch: report.batchNumber } }}
                          prefetch={false}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {report.batchNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{report.labName ?? "—"}</TableCell>
                      <TableCell>{reportTypeLabel(report.testType, "—")}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.testedAt ? (
                          <time dateTime={report.testedAt}>
                            {testDate.format(new Date(report.testedAt))}
                          </time>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-2">
                          {original && (
                            <a href={original} target="_blank" rel="noreferrer"
                               className={buttonVariants({ variant: "ghost", size: "sm" })}
                               aria-label={`Open lab original for ${title}, ${report.batchNumber}`}>
                              Lab original <ExternalLinkIcon />
                            </a>
                          )}
                          <a href={certificateCopy(report.fileKey, report.batchNumber)}
                             target="_blank" rel="noreferrer"
                             className={buttonVariants({ variant: "outline", size: "sm" })}
                             aria-label={`Open certificate copy for ${title}, ${report.batchNumber}`}>
                            Store copy <ExternalLinkIcon />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm tabular-nums text-muted-foreground">
              {sorted.length === 0
                ? "0 reports"
                : `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + rows.length} of ${sorted.length} reports`}
            </p>
            {pageCount > 1 && (
              <nav aria-label="Report pages" className="flex items-center gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pageCount}
                </span>
                {page < pageCount && (
                  <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </>
      )}
    </main>
  );
}
