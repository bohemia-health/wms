import { redirect } from "next/navigation";
import { getStaff } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Every page here depends on who is asking, so none can be prerendered:
// Next 16 would otherwise try to build them ahead of time and complain that
// the session read in getStaff is "uncached data during prerendering".
export const instant = false;

// The gate for every page in this group, and the shell they share. Signed
// out goes to the wms's own sign-in page and comes back to the dashboard;
// signed in as a customer gets a plain refusal with a way out, not the app;
// staff gets the sidebar with their own name in the footer.
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaff();
  if (staff.status === "unauthenticated") redirect("/sign-in?next=/dashboard");
  if (staff.status === "forbidden") {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="grid gap-4">
          <p>
            This account isn&rsquo;t set up for Sanoful. Ask an admin for
            access.
          </p>
          <div>
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={staff.user} />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
