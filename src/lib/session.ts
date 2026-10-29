import "server-only";
import { headers } from "next/headers";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Staff =
  | { status: "ok"; user: StaffUser }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

// Asks the API who is behind the browser's cookie. /staff/me already does the
// role check, so the three answers map straight onto what the layout does:
// 401 → send to sign-in, 403 → signed in but not staff, 200 → the user.
// no-store because a cached answer would outlive a sign-out.
export async function getStaff(): Promise<Staff> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (res.status === 401) return { status: "unauthenticated" };
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) throw new Error(`staff/me answered ${res.status}`);
  return { status: "ok", user: await res.json() };
}
