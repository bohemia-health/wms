"use client";

import * as React from "react";

import { LogoMark } from "@/components/branding/logo-mark";
import { NavGroup } from "@/components/ui/nav-documents";
import { NavMain } from "@/components/ui/nav-main";
import { NavSecondary } from "@/components/ui/nav-secondary";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  TruckIcon,
  ShoppingCartIcon,
  Megaphone,
  MegaphoneIcon,
  CreditCardReader,
  CirclePile,
  InboxIcon,
  ShelvingUnitIcon,
  PackageOpenIcon,
  LandmarkIcon,
  Wallet,
} from "lucide-react";

const data2 = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Shipments",
      url: "/shipments",
      icon: <TruckIcon />,
    },

    {
      title: "Inventory",
      url: "/inventory",
      icon: <CirclePile />,
    },

    {
      title: "Orders",
      url: "/orders",
      icon: <ShoppingCartIcon />,
    },

    {
      title: "Campaigns",
      url: "/campaigns",
      icon: <MegaphoneIcon />,
    },
    {
      title: "Projects",
      url: "#",
      icon: <FolderIcon />,
    },
    {
      title: "Team",
      url: "#",
      icon: <UsersIcon />,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/lib/data",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "/lib/reports",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Policies",
      url: "/lib/policy",
      icon: <FileIcon />,
    },
  ],

  sales: [
    {
      name: "Analytics",
      url: "/sales/analytics",
      icon: <ChartBarIcon />,
    },
    {
      name: "Transaction Log",
      url: "/sales/transactions",
      icon: <CreditCardReader />,
    },
  ],
};

/// put in real, neccessary data into the dashbaord.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },

    {
      title: "Campaigns",
      url: "/campaigns",
      icon: <MegaphoneIcon />,
    },

    {
      title: "Notifications",
      url: "/notifications",
      icon: <InboxIcon />,
    },
  ],

  warehouse: [
    {
      name: "Orders",
      url: "/orders",
      icon: <ShoppingCartIcon />,
    },

    {
      name: "Shipments",
      url: "/shipments",
      icon: <TruckIcon />,
    },

    {
      name: "Inventory",
      url: "/inventory",
      icon: <ShelvingUnitIcon />,
    },

    {
      name: "Fulfillment Center",
      url: "/fulfillment",
      icon: <PackageOpenIcon />,
    },
  ],

  banking: [
    {
      name: "Overview",
      url: "/finance/balances",
      icon: <LandmarkIcon />,
    },

    {
      name: "Payment Methods",
      url: "/banking/payment",
      icon: <Wallet />,
    },

    {
      name: "Transaction Log",
      url: "/banking/transactions",
      icon: <DatabaseIcon />,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string };
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <LogoMark className="size-5!" />
              <span className="text-base font-semibold">Bohemia Health.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavGroup label="Warehouse" items={data.warehouse} />
        <NavGroup label="Banking" items={data.banking} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ ...user, avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
