import { Skeleton } from "@/components/ui/skeleton";

export default function RoutesLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-[var(--radius)]" />
      ))}
    </div>
  );
}
