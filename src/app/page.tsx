import { redirect } from "next/navigation";

// The root is never a page of its own; the gate in (staff) takes it from here.
export default function Home() {
  redirect("/dashboard");
}
