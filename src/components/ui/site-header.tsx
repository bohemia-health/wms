import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { Button } from "@/components/ui/button";

import { KbdGroup, Kbd } from "@/components/ui/kbd";
import { PlusIcon, SearchIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="grid h-[7rem] grid-cols-[auto_1fr_auto] items-center gap-4 px-6">
      <SidebarTrigger />
      <div className="flex justify-center">
        <InputGroup className="w-full max-w-xl border h-[2.45rem]">
          <InputGroupInput placeholder="Search the website" />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <Button variant="outline" size="icon-xs" aria-label="Create">
        <PlusIcon />
      </Button>
      <div />
    </header>
  );
}
