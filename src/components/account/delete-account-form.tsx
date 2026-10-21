"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAccount } from "@/lib/account-actions";

/** Two-step destructive action: reveal, then type DELETE to enable the button. */
export function DeleteAccountForm({ isDemo }: { isDemo: boolean }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  if (!open) {
    return (
      <div className="rounded-xl border border-danger-ink/30 bg-danger-soft/50 p-5">
        <p className="text-sm text-text-secondary">
          {isDemo
            ? "Clear the demo cookies in this browser and return to the sign-in page."
            : "Permanently delete your account, profile and saved snapshots. This cannot be undone."}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-10 items-center rounded-full border border-danger-ink/40 px-5 text-sm font-semibold text-danger-ink hover:bg-danger-soft"
        >
          {isDemo ? "End demo session" : "Delete my account"}
        </button>
      </div>
    );
  }

  return (
    <form action={deleteAccount} className="rounded-xl border border-danger-ink/40 bg-danger-soft/50 p-5">
      <p className="flex items-start gap-2 text-sm font-medium text-danger-ink">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {isDemo ? "This clears your demo session." : "This permanently deletes your account and data."}
      </p>
      <label htmlFor="confirm" className="mt-3 block text-sm text-text-primary">
        Type <strong>DELETE</strong> to confirm
      </label>
      <input
        id="confirm"
        name="confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        className="mt-1 w-full max-w-xs rounded-lg border border-border-strong bg-bg-card px-3.5 py-2.5 text-[15px] focus:border-danger-ink focus:outline-none focus:ring-2 focus:ring-danger-ink/20"
      />
      <div className="mt-4 flex gap-3">
        <SubmitButton variant="destructive" size="sm" disabled={typed.trim() !== "DELETE"} pendingLabel="Deleting…">
          {isDemo ? "End session" : "Delete permanently"}
        </SubmitButton>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-text-secondary hover:bg-bg-subtle"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
