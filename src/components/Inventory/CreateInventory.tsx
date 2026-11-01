import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CreateButton() {
  const handleClick = () => {};

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost">
            <PlusIcon />
          </Button>
        }
      />
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuItem>
          <Link href="/inventory/item/new">Item</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Category</DropdownMenuItem>
        <DropdownMenuItem>Vendor</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
