import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The one way to add to inventory. Item is live; the other two are stubs
// until their forms exist, so they are shown but disabled rather than
// leading nowhere.
export default function CreateButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Add
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href="/inventory/item/new" />}>
          Item
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/inventory/item/bulk" />}>
          Items in bulk
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Category</DropdownMenuItem>
        <DropdownMenuItem disabled>Vendor</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
