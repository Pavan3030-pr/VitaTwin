import { Wind } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/card";
import type { EnvironmentSnapshot } from "@/types/twin";

export function EnvironmentCard({ env, city }: { env: EnvironmentSnapshot | null; city: string }) {
  return (
    <section aria-labelledby="env-title">
      <SectionTitle hint="Real data · Open-Meteo">Environment</SectionTitle>
      <Card>
        <p id="env-title" className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Wind className="h-4 w-4 text-primary-strong" aria-hidden="true" />
          Live exposure in {city}
        </p>
        {env ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["AQI (US)", env.usAqi ?? "—"],
                ["PM2.5", env.pm25 !== null ? `${Math.round(env.pm25)} µg/m³` : "—"],
                ["Feels like", env.apparentTemperatureC !== null ? `${Math.round(env.apparentTemperatureC)} °C` : "—"],
                ["Humidity", env.humidityPct !== null ? `${Math.round(env.humidityPct)} %` : "—"],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs text-text-muted">{k}</dt>
                  <dd className="num font-display text-xl font-semibold text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm text-text-secondary">
              {env.aqiCategory}. Pollution and heat feed the acute-risk model with published effect sizes.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">
            The live feed is unreachable right now, so the twin is running without the environment layer.
          </p>
        )}
      </Card>
    </section>
  );
}
