"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Ends the API session and returns to the sign-in page. Used from the
// layout's "not staff" refusal so a customer who signed in here can get out.
export function SignOutButton({
  variant = "outline",
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  return (
    <Button
      variant={variant}
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
      }}
    >
      Sign out
    </Button>
  );
}
