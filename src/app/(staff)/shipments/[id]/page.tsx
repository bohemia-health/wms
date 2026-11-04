import { redirect } from "next/navigation";

// Shipments are worked from the list, where each row opens in place.
export default function Page() {
  redirect("/shipments");
}
