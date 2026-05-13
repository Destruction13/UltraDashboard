import { PageShell } from "@/components/shell/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewLoading() {
  return (
    <PageShell
      eyebrow="UltraDashboard · V1"
      title={<Skeleton className="h-7 w-72" />}
      description={<Skeleton className="h-4 w-96" />}
    >
      <div className="flex flex-col gap-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[var(--radius)]" />
          ))}
        </section>
        <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
      </div>
    </PageShell>
  );
}
