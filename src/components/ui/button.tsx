import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

/**
 * Button variants (DESIGN.md): primary, secondary (outline), ghost,
 * destructive. Light theme only — no `dark:` classes.
 * Primary uses teal-700 so white label text meets WCAG AA.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-strong/40 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "active:translate-y-px touch-manipulation select-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary-strong text-white hover:bg-primary-hover",
        secondary:
          "border border-border-strong bg-bg-card text-text-primary hover:border-primary-strong hover:text-primary-strong",
        ghost: "bg-transparent text-text-primary hover:bg-bg-subtle",
        destructive: "bg-danger-ink text-white hover:bg-danger-ink/90",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-sm",
        md: "h-11 rounded-full px-5 text-sm",
        lg: "h-12 rounded-full px-7 text-base",
        icon: "h-10 w-10 rounded-full",
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
