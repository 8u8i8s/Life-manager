import Link from "next/link";
import { redirect } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentUserContext } from "@/lib/data/profile";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 px-1"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            P
          </div>
          <span className="font-semibold tracking-tight">PULI OS</span>
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="text-sm font-medium text-muted-foreground">
              {context.company?.name ?? "No company"}
            </span>
          </div>
          <UserMenu
            fullName={context.profile.full_name}
            email={context.email}
          />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
