import CreateButton from "@/components/Inventory/CreateInventory";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";

type Item = {
  id: string;
  name: string;
  size: string | null;
  form: string | null;
  price: string;
  slug: string | null;
};

export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
    cache: "no-store",
  });
  const items: Item[] = await res.json();

  const handleClick = () => {};
  return (
    <main>
      <CreateButton />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Form</TableHead>
            <TableHead>Slug</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow>
              <TableCell>
                {item.name} {item.size}
              </TableCell>
              <TableCell>{item.price}</TableCell>
              <TableCell>{item.form}</TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell className="max-w-xs">
                <Button variant="ghost" className="hover:bg-transparent!">
                  <MoreHorizontalIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
