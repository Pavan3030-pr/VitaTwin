import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

/**
 * Button variants (DESIGN.md): primary, secondary (outline), ghost,
 * destructive. Light theme only — no dark mode, no `dark:` classes.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "active:scale-[.99] touch-manipulation select-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary:
          "border border-border bg-bg-card text-text-primary hover:bg-bg-subtle hover:border-border-strong",
        ghost: "bg-transparent text-text-primary hover:bg-bg-subtle",
        destructive: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-sm",
        md: "h-10 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button
      data-variant={variant ?? "primary"}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
