import { STATUS_LABEL, readingStatus, type ReadingStatus } from "@/services/twin-status";

/**
 * The twin, drawn: a calm silhouette (the person) with a dashed offset copy
 * (the twin) and live data nodes. A single ECG trace draws once on load.
 * Purely presentational — every reading arrives as a prop.
 */

export interface TwinReadings {
  heartRate: number;
  spo2: number;
  sleepHours: number;
  hba1c: number | null;
}

const NODE_FILL: Record<ReadingStatus, string> = {
  low: "#10B981",
  moderate: "#F59E0B",
  high: "#EF4444",
};

const STATUS_INK: Record<ReadingStatus, string> = {
  low: "text-success-ink",
  moderate: "text-warning-ink",
  high: "text-danger-ink",
};

interface NodeSpec {
  id: string;
  label: string;
  value: string;
  status: ReadingStatus;
  /** Node position inside the 400 × 440 drawing. */
  at: [number, number];
  side: "left" | "right";
  /** Vertical centre of the chip in drawing units. */
  chipY: number;
}

function buildNodes(readings: TwinReadings): NodeSpec[] {
  const hbStatus: ReadingStatus =
    readings.hba1c === null ? "moderate" : readingStatus("hba1c", readings.hba1c);

  return [
    {
      id: "sleep",
      label: "Sleep last night",
      value: `${readings.sleepHours} h`,
      status: readingStatus("sleep", readings.sleepHours),
      at: [214, 84],
      side: "right",
      chipY: 88,
    },
    {
      id: "heart",
      label: "Resting heart rate",
      value: `${readings.heartRate} bpm`,
      status: readingStatus("heart-rate", readings.heartRate),
      at: [224, 236],
      side: "right",
      chipY: 236,
    },
    {
      id: "lungs",
      label: "Blood oxygen",
      value: `${readings.spo2}%`,
      status: readingStatus("spo2", readings.spo2),
      at: [172, 208],
      side: "left",
      chipY: 208,
    },
    {
      id: "glucose",
      label: "Glucose control",
      value: readings.hba1c === null ? "—" : `HbA1c ${readings.hba1c}%`,
      status: hbStatus,
      at: [190, 300],
      side: "left",
      chipY: 304,
    },
  ];
}

const BUST =
  "M185 124 V150 C150 158 114 170 104 212 C99 240 103 310 108 372 H292 C297 310 301 240 296 212 C286 170 250 158 215 150 V124 Z";

export function TwinFigure({ readings }: { readings: TwinReadings }) {
  const nodes = buildNodes(readings);

  return (
    <div className="mx-auto w-full max-w-[460px]" role="group" aria-label="Digital twin with live readings">
    <div className="relative aspect-[300/440] overflow-hidden sm:aspect-[400/440] sm:overflow-visible">
      <svg
        viewBox="0 0 400 440"
        className="absolute left-1/2 top-0 h-full w-[133.34%] max-w-none -translate-x-1/2 sm:inset-0 sm:left-0 sm:w-full sm:translate-x-0"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="twin-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Aura */}
        <circle cx="200" cy="236" r="168" stroke="#0D9488" strokeOpacity="0.1" />
        <circle cx="200" cy="236" r="126" stroke="#0D9488" strokeOpacity="0.14" />

        {/* The twin: offset dashed copy */}
        <g transform="translate(16 10)" stroke="#0D9488" strokeOpacity="0.55" strokeDasharray="5 6" strokeWidth="1.6">
          <circle cx="200" cy="88" r="38" />
          <path d={BUST} />
        </g>

        {/* The person */}
        <g fill="url(#twin-body)" stroke="#0F766E" strokeWidth="2">
          <circle cx="200" cy="88" r="38" />
          <path d={BUST} />
        </g>

        {/* Leader lines (only where the chips sit beside the figure) */}
        {nodes.map((node) => (
          <line
            className="hidden sm:inline"
            key={node.id}
            x1={node.at[0]}
            y1={node.at[1]}
            x2={node.side === "left" ? 98 : 302}
            y2={node.chipY}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {/* Data nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.at[0]} cy={node.at[1]} r="11" fill={NODE_FILL[node.status]} fillOpacity="0.18" />
            <circle cx={node.at[0]} cy={node.at[1]} r="5.5" fill={NODE_FILL[node.status]} stroke="#FFFFFF" strokeWidth="2" />
          </g>
        ))}

        {/* ECG baseline + the one animated moment */}
        <path d="M28 402 H372" stroke="#CBD5E1" strokeWidth="1.2" />
        <path
          className="ecg-trace animate-ecg-draw"
          pathLength={1}
          d="M28 402 H120 L134 402 L144 384 L156 426 L170 372 L184 410 L194 402 H226 L238 396 L250 402 H372"
          stroke="#0F766E"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute hidden w-[25.5%] rounded-lg border border-border bg-bg-card/95 px-2 py-1.5 sm:block"
          style={{
            top: `${((node.chipY - 28) / 440) * 100}%`,
            [node.side]: 0,
          }}
        >
          <p className="text-[10.5px] leading-tight text-text-secondary">{node.label}</p>
          <p className="num mt-0.5 font-display text-sm font-semibold leading-tight text-text-primary">
            {node.value}
          </p>
          <p className={`mt-0.5 text-[10px] font-semibold leading-none ${STATUS_INK[node.status]}`}>
            {STATUS_LABEL[node.status]}
          </p>
        </div>
      ))}
    </div>

    <ul className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
      {nodes.map((node) => (
        <li key={node.id} className="rounded-lg border border-border bg-bg-card px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: NODE_FILL[node.status] }}
              aria-hidden="true"
            />
            {node.label}
          </p>
          <p className="num mt-0.5 font-display text-base font-semibold text-text-primary">
            {node.value}
          </p>
          <p className={`text-[11px] font-semibold ${STATUS_INK[node.status]}`}>
            {STATUS_LABEL[node.status]}
          </p>
        </li>
      ))}
    </ul>
    </div>
  );
}
