"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Sparkles, ShieldCheck, type LucideIcon } from "lucide-react";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

const STEPS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Activity,
    title: "Meet your twin",
    body: "The dashboard combines wearable signals and health records into one living picture, refreshed on every visit.",
  },
  {
    icon: Sparkles,
    title: "See the reasons, then try changes",
    body: "Every risk score shows what drove it. Use the what-if sliders to see how sleep, glucose or smoking would move it.",
  },
  {
    icon: ShieldCheck,
    title: "Synthetic and safe",
    body: "All patients here are generated, and VitaTwin is decision support, not a diagnosis. Import your own data from Connect your data.",
  },
];

/** First-run welcome tour. Shown once per browser; skippable at any step. */
export function OnboardingDialog() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  const finish = () => {
    setOpen(false);
    // Written synchronously so an immediate reload cannot show the tour again.
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ONBOARDING_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  };

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const { icon: Icon, title, body } = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 print:hidden flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-bg-card p-6 shadow-xl outline-none"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-wash text-primary-strong">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-medium text-text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 id="onboarding-title" className="mt-1 font-display text-xl font-semibold text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="inline-flex h-10 items-center rounded-full bg-primary-strong px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {last ? "Start exploring" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
