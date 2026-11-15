"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function FulfillmentBar() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing
      ) return;

      event.preventDefault();
      router.push("/dashboard");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <nav
      aria-label="Fulfillment navigation"
      className="grid grid-cols-[1fr_auto_1fr] items-center border-b bg-background px-3 py-1 sm:px-8"
    >
      <Link
        href="/dashboard"
        aria-label="Back to dashboard"
        aria-keyshortcuts="Escape"
        title="Back to dashboard (Esc)"
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 justify-self-start rounded-sm px-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Back to dashboard</span>
        <kbd
          aria-hidden="true"
          className="hidden rounded border px-1 text-xs text-muted-foreground sm:inline"
        >
          Esc
        </kbd>
      </Link>
      <span className="font-semibold">Sanoful Fulfillment</span>
    </nav>
  );
}
