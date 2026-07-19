export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute left-[8%] top-[12%] size-80 rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[8%] right-[8%] size-72 rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="relative mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-400 font-bold text-primary-foreground shadow-lg shadow-primary/20">
          P
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-[-0.025em]">PULI OS</span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Intelligent operations
          </span>
        </div>
      </div>
      <div className="relative w-full flex justify-center">{children}</div>
    </main>
  );
}
