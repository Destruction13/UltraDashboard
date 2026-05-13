import { Skeleton } from "@/components/ui/skeleton";

export default function OmniRouteLoading() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius)]" />
        ))}
      </section>
      <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
    </div>
  );
}
