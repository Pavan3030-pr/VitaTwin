import { PERSONAS } from "@/lib/cohort";
import { selectPatient } from "@/lib/patient-actions";

/** Server-action form: switches the synthetic patient without client JS. */
export function PatientSwitcher({ activeId }: { activeId: string }) {
  return (
    <form action={selectPatient} className="flex flex-wrap gap-1.5" aria-label="Switch patient">
      {PERSONAS.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="submit"
            name="patientId"
            value={p.id}
            aria-pressed={active}
            title={p.headline}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-primary-strong bg-primary-soft text-primary-deep"
                : "border-border-strong text-text-secondary hover:border-primary-strong hover:text-primary-strong"
            }`}
          >
            {p.demographics.firstName}
          </button>
        );
      })}
    </form>
  );
}
