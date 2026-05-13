import { Skeleton } from "@/components/ui/skeleton";

export default function ProvidersLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-16 w-full rounded-[var(--radius)]" />
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}
