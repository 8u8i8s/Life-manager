"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
