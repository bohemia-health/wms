import { Suspense } from "react";
import { LogoMark } from "@/components/branding/logo-mark";
import { SignInForm } from "./SignInForm";

// Staff sign-in. Outside the (staff) group on purpose: the gate must not
// wrap the page that gets you past the gate. No sign-up link, no store
// chrome; accounts are created by an admin.
export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark className="size-6" />
          <span className="text-lg font-semibold">Sanoful</span>
        </div>
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
