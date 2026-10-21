"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  /** Label shown while this button's form is submitting. */
  pendingLabel?: string;
}

/**
 * Submit button with a built-in loading state. While the surrounding form's
 * server action runs, every SubmitButton in it is disabled (no double submits)
 * and the one that was pressed shows a spinner and `pendingLabel`.
 */
export function SubmitButton({ children, pendingLabel, name, value, disabled, ...props }: SubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const pressed = pending && (!name || data?.get(name) === value);

  return (
    <Button type="submit" name={name} value={value} disabled={disabled || pending} aria-busy={pressed} {...props}>
      {pressed ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
