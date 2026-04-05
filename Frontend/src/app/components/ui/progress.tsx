"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/15 relative h-2.5 w-full overflow-hidden rounded-full border border-white/65 shadow-[inset_1px_1px_3px_rgba(47,72,88,0.16),inset_-1px_-1px_2px_rgba(255,255,255,0.55)]",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all bg-gradient-to-r from-[#00D6D0] via-[#00B0BC] to-[#188CA0] shadow-[0_6px_10px_rgba(0,176,188,0.28)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
