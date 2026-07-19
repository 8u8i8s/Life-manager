"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar p-5 text-sidebar-foreground"
      >
        <SheetHeader className="p-0 pb-7">
          <SheetTitle className="flex items-center gap-3 text-sidebar-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-violet-400 text-sm font-bold text-sidebar-primary-foreground">
              P
            </span>
            PULI OS
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
