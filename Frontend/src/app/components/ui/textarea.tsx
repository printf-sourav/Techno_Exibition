import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-border/70 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-xl border bg-input-background/95 px-3.5 py-2.5 text-base backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_4px_rgba(47,72,88,0.08),0_10px_18px_rgba(47,72,88,0.08)] transition-[color,box-shadow,transform] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
