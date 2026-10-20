import { ExternalLink } from "lucide-react";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import report from "@/data/validation.json";

export const dynamic = "force-dynamic";

function Roc() {
  const pts = report.roc;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${10 + p.fpr * 180},${190 - p.tpr * 180}`).join(" ");
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-xs" role="img" aria-label="ROC curve of the VitaTwin CVD score on the Cleveland cohort">
      <rect x="10" y="10" width="180" height="180" fill="none" stroke="#E2E8F0" />
      <line x1="10" y1="190" x2="190" y2="10" stroke="#CBD5E1" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="#0D9488" strokeWidth="2" />
      <text x="100" y="198" textAnchor="middle" fontSize="8" fill="#64748B">1 − specificity</text>
      <text x="4" y="100" fontSize="8" fill="#64748B" transform="rotate(-90 4 100)" textAnchor="middle">sensitivity</text>
    </svg>
  );
}

export default function ValidationPage() {
  const d = report.dataset;
  return (
    <div className="space-y-7">
      <PageHeader
        title="Model validation on real patients"
        description="The twin's cardiovascular score is run, unchanged, on 303 real de-identified patients. We publish the result, including where it is weak."
      />

      <section>
        <SectionTitle hint={`Generated ${report.generatedAt}`}>Discrimination (AUC)</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.models.map((m) => (
            <Card key={m.id}>
              <p className="num font-display text-4xl font-semibold text-text-primary">{m.auc.toFixed(2)}</p>
              {"ci95" in m && m.ci95 ? (
                <p className="text-xs text-text-muted">95% CI {m.ci95[0].toFixed(2)}–{m.ci95[1].toFixed(2)} (bootstrap)</p>
              ) : null}
              <p className="mt-2 text-sm font-semibold text-text-primary">{m.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{m.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <SectionTitle hint="Higher risk → more disease">Observed disease by risk quartile</SectionTitle>
          <Card className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-subtle text-xs text-text-secondary">
                <tr><th className="px-4 py-2 font-medium">Quartile</th><th className="px-4 py-2 font-medium">Model risk</th><th className="px-4 py-2 font-medium">n</th><th className="px-4 py-2 font-medium">Disease on angiography</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.quartiles.map((q) => (
                  <tr key={q.quartile}>
                    <td className="px-4 py-2 font-semibold">{q.quartile}</td>
                    <td className="num px-4 py-2">{q.riskRange}</td>
                    <td className="num px-4 py-2">{q.n}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-bg-subtle"><div className="h-2 rounded-full bg-primary" style={{ width: `${q.observedDiseasePct}%` }} /></div>
                        <span className="num font-semibold">{q.observedDiseasePct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
        <section>
          <SectionTitle hint="VitaTwin CVD score">ROC curve</SectionTitle>
          <Card className="flex justify-center"><Roc /></Card>
        </section>
      </div>

      <section>
        <SectionTitle>Operating points</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {report.operatingPoints.map((o) => (
            <Card key={o.cutoffPct}>
              <p className="text-sm font-semibold text-text-primary">Flag if 10-yr risk ≥ {o.cutoffPct}%</p>
              <p className="mt-1 text-sm text-text-secondary">
                Sensitivity <span className="num font-semibold text-text-primary">{o.sensitivity}%</span> · specificity{" "}
                <span className="num font-semibold text-text-primary">{o.specificity}%</span> · flags{" "}
                <span className="num font-semibold text-text-primary">{o.flaggedPct}%</span> of patients
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="space-y-2">
        <p className="text-sm font-semibold text-text-primary">Dataset</p>
        <p className="text-sm text-text-secondary">
          {d.name}: n = {d.n}, {d.disease} with angiographic disease ({d.prevalencePct}%); mean age {d.meanAgeDisease} vs {d.meanAgeNoDisease}.
        </p>
        <p className="text-xs text-text-muted">{d.citation}</p>
        <a href={d.url} className="inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline" target="_blank" rel="noreferrer">
          Source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <p className="pt-2 text-sm font-semibold text-text-primary">Limitations (read these)</p>
        <ul className="space-y-1 text-xs text-text-secondary">
          {report.limitations.map((l) => (<li key={l}>• {l}</li>))}
        </ul>
        <p className="text-xs text-text-muted">Reproduce: <code>npm run validate</code></p>
      </Card>
    </div>
  );
}
