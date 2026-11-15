import { headers } from "next/headers";

// The printable label for one batch, fetched from the API with the staff
// session and passed through as-is. Going through the WMS means the link
// works wherever the API lives and never exposes its origin to the page.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("not found", { status: 404 });
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/staff/batches/${id}/label.svg`,
    { headers: { cookie }, cache: "no-store" },
  );
  if (!res.ok) return new Response("not found", { status: res.status });
  return new Response(await res.text(), {
    headers: {
      "content-type": "image/svg+xml",
      "content-disposition": `inline; filename="batch-${id}-label.svg"`,
    },
  });
}
