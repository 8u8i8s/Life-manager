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
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="pointer-events-none absolute -left-20 top-0 size-64 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <Link
          href="/dashboard"
          className="relative mb-9 flex items-center gap-3 px-1"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-violet-400 font-bold text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-[-0.025em] text-white">PULI OS</span>
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/45">
              Command center
            </span>
          </div>
        </Link>
        <SidebarNav />
        <div className="relative mt-auto rounded-2xl border border-sidebar-border bg-white/[0.035] p-4">
          <p className="text-xs font-semibold text-sidebar-foreground">AI workspace</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/50">
            Inquiries, quotes and production in one calm workspace.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl md:px-7">
          <div className="flex items-center gap-2">
            <MobileNav />
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Workspace
              </span>
              <span className="text-sm font-semibold text-foreground/90">
                {context.company?.name ?? "No company"}
              </span>
            </div>
          </div>
          <UserMenu
            fullName={context.profile.full_name}
            email={context.email}
          />
        </header>
        <main className="flex-1 p-4 md:p-7 lg:p-9">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
