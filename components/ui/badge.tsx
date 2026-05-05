import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border/60 bg-background/40 text-muted-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
        violet:
          "border-[hsl(var(--tag-violet)/0.4)] bg-[hsl(var(--tag-violet)/0.12)] text-[hsl(var(--tag-violet))]",
        amber:
          "border-[hsl(var(--tag-amber)/0.4)] bg-[hsl(var(--tag-amber)/0.12)] text-[hsl(var(--tag-amber))]",
        emerald:
          "border-[hsl(var(--tag-emerald)/0.4)] bg-[hsl(var(--tag-emerald)/0.12)] text-[hsl(var(--tag-emerald))]",
        rose: "border-[hsl(var(--tag-rose)/0.4)] bg-[hsl(var(--tag-rose)/0.12)] text-[hsl(var(--tag-rose))]",
        sky: "border-[hsl(var(--tag-sky)/0.4)] bg-[hsl(var(--tag-sky)/0.12)] text-[hsl(var(--tag-sky))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
