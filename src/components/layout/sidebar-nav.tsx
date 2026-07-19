"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  FileText,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="relative flex flex-col gap-1.5">
      <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
        Workspace
      </p>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0/0.04)]"
                : "text-sidebar-foreground/55 hover:bg-white/[0.04] hover:text-sidebar-foreground"
            )}
          >
            {isActive ? (
              <span className="absolute -left-5 h-6 w-1 rounded-r-full bg-sidebar-primary shadow-[0_0_16px_var(--sidebar-primary)]" />
            ) : null}
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "bg-transparent text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80"
              )}
            >
              <Icon className="size-4" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
