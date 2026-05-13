import { Skeleton } from "@/components/ui/skeleton";

export default function LiveRunsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 w-full rounded-[var(--radius)]" />
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}
