import * as React from "react"

import { cn } from "@/lib/utils"
import { VariantProps, cva } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full rounded-md border-2 border-black dark:border-dark-border bg-white dark:bg-dark-input px-3 py-2 text-sm text-black dark:text-dark-font file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-black/50 dark:placeholder:text-dark-font/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 -outline-offset-2 focus-visible:outline focus-visible:outline-black focus-visible:outline-2 focus-visible:outline-offset-[-6px] dark:focus-visible:outline-dark-border",
  {
    variants: {
      size: {
        small: " h-8 ",
        default: "h-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size, className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
