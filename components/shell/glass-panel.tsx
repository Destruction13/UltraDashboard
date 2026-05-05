import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Premium glass panel primitive.
 *
 * Used for cards, navigation bars, and any surface that should sit on top of
 * the shader-backed atmosphere. Pairs the `.glass-panel` base layer with sane
 * spacing defaults so most consumers can drop it in directly.
 */
export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("glass-panel p-6", className)} {...props}>
      <div className="relative z-[1]">{children}</div>
    </div>
  ),
);
GlassPanel.displayName = "GlassPanel";
