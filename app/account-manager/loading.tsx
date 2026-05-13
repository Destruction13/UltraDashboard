import { PageShell } from "@/components/shell/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountManagerLoading() {
  return (
    <PageShell
      eyebrow="ACCOUNTMANAGER"
      title={<Skeleton className="h-7 w-80" />}
      description={<Skeleton className="h-4 w-[28rem] max-w-full" />}
    >
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-full rounded-[var(--radius)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
