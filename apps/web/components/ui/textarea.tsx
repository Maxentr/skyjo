import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-2 border-black dark:border-dark-border bg-white dark:bg-dark-input px-3 py-2 text-sm text-black dark:text-dark-font ring-offset-white placeholder:text-black/50 dark:placeholder:text-dark-font/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 -outline-offset-2 focus-visible:outline focus-visible:outline-black focus-visible:outline-2 focus-visible:outline-offset-[-6px] dark:focus-visible:outline-dark-border",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
