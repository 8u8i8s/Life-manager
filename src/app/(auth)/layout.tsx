export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          P
        </div>
        <span className="text-xl font-semibold tracking-tight">PULI OS</span>
      </div>
      {children}
    </main>
  );
}
