/**
 * Growth content panel.
 *
 * Layout (top → bottom):
 *   1. Static "Growth Info" card — mid-parental height, mother, father,
 *      gestation period. Always expanded; reads like the Obstetric
 *      patient-info block.
 *   2. Five chart cards stacked one below the other:
 *      Height · Weight · BMI · OFC · Height-vs-Weight.
 *      Each chart carries its own toggles for percentile lines (off
 *      by default) and time-axis units (Years on by default,
 *      switching off renders months).
 *
 * Charts are rendered via recharts LineChart. Mock measurement series
 * + WHO-shaped percentile bands (P3 / P15 / P50 / P85 / P97) live in
 * this file; in production a backend payload would supply the same
 * shape.
 */
import React, { useMemo, useState } from "react";
import { Calendar2 } from "iconsax-reactjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
  ScatterChart,
} from "recharts";
import { ActionButton } from "../detail-shared";
import { AiTriggerIcon } from "../../dr-agent/shared/AiTriggerIcon";
import { HistoricalNewDataBanner } from "../HistoricalNewDataBanner";

// ── Static patient context ────────────────────────────────────────────────────

const PATIENT_INFO = {
  midParentalHeight: "168 cm",
  motherHeight: "162 cm",
  fatherHeight: "176 cm",
  gestationPeriod: "39 weeks",
};

// ── Mock measurement series (age in months → value) ───────────────────────────
//
// Patient's recorded measurements over time. Demo data covers ~3
// years with monthly cadence in early childhood, sparser later.

const PATIENT_HEIGHT = [
  { ageMonths: 0, value: 50 },
  { ageMonths: 3, value: 60 },
  { ageMonths: 6, value: 67 },
  { ageMonths: 12, value: 75 },
  { ageMonths: 18, value: 82 },
  { ageMonths: 24, value: 87 },
  { ageMonths: 30, value: 93 },
  { ageMonths: 36, value: 96 },
];

const PATIENT_WEIGHT = [
  { ageMonths: 0, value: 3.4 },
  { ageMonths: 3, value: 5.8 },
  { ageMonths: 6, value: 7.6 },
  { ageMonths: 12, value: 9.4 },
  { ageMonths: 18, value: 10.8 },
  { ageMonths: 24, value: 12.0 },
  { ageMonths: 30, value: 12.8 },
  { ageMonths: 36, value: 13.4 },
];

const PATIENT_BMI = [
  { ageMonths: 0, value: 13.6 },
  { ageMonths: 3, value: 16.1 },
  { ageMonths: 6, value: 16.9 },
  { ageMonths: 12, value: 16.7 },
  { ageMonths: 18, value: 16.0 },
  { ageMonths: 24, value: 15.8 },
  { ageMonths: 30, value: 14.8 },
  { ageMonths: 36, value: 14.5 },
];

const PATIENT_OFC = [
  { ageMonths: 0, value: 34 },
  { ageMonths: 3, value: 40 },
  { ageMonths: 6, value: 43 },
  { ageMonths: 12, value: 46 },
  { ageMonths: 18, value: 47.5 },
  { ageMonths: 24, value: 48.5 },
  { ageMonths: 30, value: 49 },
  { ageMonths: 36, value: 49.4 },
];

// Height-vs-Weight: x-axis is height (cm), y-axis is weight (kg).
const HEIGHT_VS_WEIGHT = [
  { x: 50, y: 3.4 },
  { x: 60, y: 5.8 },
  { x: 67, y: 7.6 },
  { x: 75, y: 9.4 },
  { x: 82, y: 10.8 },
  { x: 87, y: 12.0 },
  { x: 93, y: 12.8 },
  { x: 96, y: 13.4 },
];

// Approx WHO-shaped percentile bands per metric. Each entry is the
// metric value at that age in months. Real chart would source from
// the WHO Growth Standards LMS tables — these are coarse stand-ins
// to give the lines plausible curvature.

const PERCENTILE_AGES = [0, 3, 6, 9, 12, 18, 24, 30, 36];

const PERCENTILES_HEIGHT = {
  P3:  [46, 56, 62, 67, 71, 77, 81, 85, 88],
  P15: [48, 58, 64, 69, 73, 79, 84, 88, 92],
  P50: [50, 61, 67, 72, 76, 82, 87, 92, 96],
  P85: [52, 64, 70, 75, 79, 86, 91, 96, 100],
  P97: [54, 66, 72, 77, 82, 89, 94, 99, 104],
};

const PERCENTILES_WEIGHT = {
  P3:  [2.5, 5.0, 6.4, 7.5, 8.4, 9.6, 10.5, 11.3, 12.0],
  P15: [2.9, 5.6, 7.0, 8.2, 9.0, 10.4, 11.4, 12.4, 13.2],
  P50: [3.4, 6.4, 7.9, 9.2, 10.1, 11.6, 12.7, 13.7, 14.6],
  P85: [4.0, 7.4, 9.0, 10.3, 11.4, 13.0, 14.2, 15.4, 16.4],
  P97: [4.5, 8.2, 10.0, 11.4, 12.6, 14.4, 15.7, 17.0, 18.1],
};

const PERCENTILES_BMI = {
  P3:  [11.5, 14.5, 15.0, 14.7, 14.4, 13.9, 13.6, 13.4, 13.2],
  P15: [12.5, 15.4, 15.7, 15.5, 15.2, 14.7, 14.4, 14.1, 13.9],
  P50: [13.4, 16.4, 16.8, 16.6, 16.2, 15.7, 15.4, 15.1, 14.9],
  P85: [14.5, 17.6, 18.0, 17.9, 17.5, 17.0, 16.6, 16.3, 16.1],
  P97: [15.5, 18.7, 19.2, 19.1, 18.7, 18.2, 17.9, 17.6, 17.4],
};

const PERCENTILES_OFC = {
  P3:  [32, 38, 41, 43, 45, 46, 47, 47.5, 48],
  P15: [33, 39, 42, 44, 46, 47, 48, 48.5, 49],
  P50: [34, 40, 43, 45, 47, 48, 49, 49.5, 50],
  P85: [35, 41, 44, 46, 48, 49, 50, 50.5, 51],
  P97: [36, 42, 45, 47, 49, 50, 51, 51.5, 52],
};

// Height-vs-Weight curves: x is height (cm), y is weight (kg).
const PERCENTILES_HVW = [
  { name: "P3",  data: [{ x: 50, y: 2.8 }, { x: 70, y: 6.6 }, { x: 90, y: 10.4 }, { x: 110, y: 16.2 }] },
  { name: "P15", data: [{ x: 50, y: 3.0 }, { x: 70, y: 7.2 }, { x: 90, y: 11.4 }, { x: 110, y: 17.6 }] },
  { name: "P50", data: [{ x: 50, y: 3.4 }, { x: 70, y: 8.2 }, { x: 90, y: 12.6 }, { x: 110, y: 19.4 }] },
  { name: "P85", data: [{ x: 50, y: 3.9 }, { x: 70, y: 9.4 }, { x: 90, y: 14.4 }, { x: 110, y: 22.0 }] },
  { name: "P97", data: [{ x: 50, y: 4.3 }, { x: 70, y: 10.4 }, { x: 90, y: 16.0 }, { x: 110, y: 24.6 }] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAgeAxisData(seriesByAge, percentiles) {
  return PERCENTILE_AGES.map((ageMonths, idx) => {
    const point = seriesByAge.find((p) => p.ageMonths === ageMonths);
    return {
      ageMonths,
      patient: point ? point.value : null,
      P3: percentiles.P3[idx],
      P15: percentiles.P15[idx],
      P50: percentiles.P50[idx],
      P85: percentiles.P85[idx],
      P97: percentiles.P97[idx],
    };
  });
}

const PERCENTILE_LINE_COLOR = "rgba(148,163,184,0.55)"; // tp-slate-400-ish
const PERCENTILE_P50_COLOR = "rgba(100,116,139,0.7)"; // tp-slate-500-ish, slightly bolder
const PATIENT_LINE_COLOR = "var(--tp-blue-500, #4B4AD5)";

// ── Building blocks ───────────────────────────────────────────────────────────

function SectionTag({ children, icon }) {
  return (
    <div className="flex h-[30px] w-full min-w-0 shrink-0 items-center gap-1.5 rounded-[4px] bg-tp-slate-100/70 px-2 py-[3px] mb-[4px]">
      {icon ? icon : null}
      <span className="flex min-h-0 min-w-0 flex-1 items-center text-left font-sans font-semibold text-tp-slate-500 text-[14px] leading-none">
        {children}
      </span>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-[6px] rounded-[6px] px-[6px] py-[2px] text-[12px] font-medium text-tp-slate-600 transition-colors hover:bg-tp-slate-50">
      <span
        aria-hidden
        className={`relative inline-block h-[14px] w-[24px] rounded-full transition-colors ${
          checked ? "bg-tp-blue-500" : "bg-tp-slate-300"
        }`}>
        <span
          className={`absolute top-[1px] inline-block h-[12px] w-[12px] rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.2)] transition-transform ${
            checked ? "translate-x-[11px]" : "translate-x-[1px]"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

function GrowthInfoCard() {
  return (
    <div className="relative shrink-0 w-full px-[12px] py-[12px] flex flex-col gap-[6px]" style={{ border: "0.8px solid var(--tp-slate-200)", borderRadius: 10 }}>
      <SectionTag icon={<Calendar2 size={18} variant="Bulk" color="var(--tp-slate-500)" className="shrink-0" />}>
        Growth Info
      </SectionTag>
      <div className="grid grid-cols-1 gap-[6px] pl-[6px]">
        <InfoRow label="Mid-parental height" value={PATIENT_INFO.midParentalHeight} />
        <InfoRow label="Mother" value={PATIENT_INFO.motherHeight} />
        <InfoRow label="Father" value={PATIENT_INFO.fatherHeight} />
        <InfoRow label="Gestation period" value={PATIENT_INFO.gestationPeriod} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[14px] leading-[20px]">
      <span className="font-sans font-normal text-tp-slate-500">{label}</span>
      <span className="font-sans font-medium text-tp-slate-700">{value}</span>
    </div>
  );
}

function ChartFrame({ title, children, showPercentiles, onTogglePercentiles, showYears, onToggleYears }) {
  return (
    <div
      className="relative shrink-0 w-full px-[12px] py-[12px] flex flex-col gap-[8px]"
      style={{ border: "0.8px solid var(--tp-slate-200)", borderRadius: 10 }}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-sans text-[14px] font-semibold leading-[20px] text-tp-slate-700">{title}</p>
        <AiTriggerIcon
          tooltip={`Summarize ${title.toLowerCase()}`}
          signalLabel={`Summarize ${title.toLowerCase()}`}
          sectionId="growth"
          size={12}
          as="span" />
      </div>
      <div className="flex flex-wrap items-center gap-x-[6px] gap-y-[4px]">
        <ToggleRow label="Percentile lines" checked={showPercentiles} onChange={onTogglePercentiles} />
        <ToggleRow label={showYears ? "Years" : "Months"} checked={showYears} onChange={onToggleYears} />
      </div>
      <div className="h-[200px] w-full">
        {children}
      </div>
    </div>
  );
}

function AgeAxisChart({ data, valueLabel, showPercentiles, showYears, yDomain }) {
  const tickFormatter = (m) => (showYears ? `${(m / 12).toFixed(m % 12 === 0 ? 0 : 1)}y` : `${m}m`);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid stroke="rgba(226,232,240,0.6)" vertical={false} />
        <XAxis
          dataKey="ageMonths"
          type="number"
          domain={[0, 36]}
          ticks={PERCENTILE_AGES}
          tickFormatter={tickFormatter}
          tick={{ fill: "var(--tp-slate-500)", fontSize: 11 }}
          stroke="var(--tp-slate-200)" />
        <YAxis
          domain={yDomain}
          tick={{ fill: "var(--tp-slate-500)", fontSize: 11 }}
          stroke="var(--tp-slate-200)"
          width={36}
          label={{ value: valueLabel, angle: -90, position: "insideLeft", offset: 14, style: { fill: "var(--tp-slate-500)", fontSize: 11 } }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: "var(--tp-slate-200)", fontSize: 12 }}
          labelFormatter={(m) => tickFormatter(m)} />
        {showPercentiles ? (
          <>
            <Line type="monotone" dataKey="P3"  stroke={PERCENTILE_LINE_COLOR} strokeWidth={1} dot={false} strokeDasharray="3 3" name="P3" />
            <Line type="monotone" dataKey="P15" stroke={PERCENTILE_LINE_COLOR} strokeWidth={1} dot={false} strokeDasharray="3 3" name="P15" />
            <Line type="monotone" dataKey="P50" stroke={PERCENTILE_P50_COLOR} strokeWidth={1.4} dot={false} name="P50" />
            <Line type="monotone" dataKey="P85" stroke={PERCENTILE_LINE_COLOR} strokeWidth={1} dot={false} strokeDasharray="3 3" name="P85" />
            <Line type="monotone" dataKey="P97" stroke={PERCENTILE_LINE_COLOR} strokeWidth={1} dot={false} strokeDasharray="3 3" name="P97" />
          </>
        ) : null}
        <Line
          type="monotone"
          dataKey="patient"
          stroke={PATIENT_LINE_COLOR}
          strokeWidth={2.2}
          dot={{ r: 3, fill: PATIENT_LINE_COLOR }}
          activeDot={{ r: 4 }}
          name="Patient" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function HeightVsWeightChart({ showPercentiles }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 6, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid stroke="rgba(226,232,240,0.6)" vertical={false} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[45, 110]}
          tick={{ fill: "var(--tp-slate-500)", fontSize: 11 }}
          stroke="var(--tp-slate-200)"
          label={{ value: "Height (cm)", position: "insideBottom", offset: -2, style: { fill: "var(--tp-slate-500)", fontSize: 11 } }} />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 28]}
          tick={{ fill: "var(--tp-slate-500)", fontSize: 11 }}
          stroke="var(--tp-slate-200)"
          width={36}
          label={{ value: "Weight (kg)", angle: -90, position: "insideLeft", offset: 14, style: { fill: "var(--tp-slate-500)", fontSize: 11 } }} />
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: "var(--tp-slate-200)", fontSize: 12 }} />
        {showPercentiles ? (
          PERCENTILES_HVW.map((p) => (
            <Scatter
              key={p.name}
              name={p.name}
              data={p.data}
              line={{ stroke: p.name === "P50" ? PERCENTILE_P50_COLOR : PERCENTILE_LINE_COLOR, strokeWidth: p.name === "P50" ? 1.4 : 1, strokeDasharray: p.name === "P50" ? undefined : "3 3" }}
              shape={() => null} />
          ))
        ) : null}
        <Scatter
          name="Patient"
          data={HEIGHT_VS_WEIGHT}
          fill={PATIENT_LINE_COLOR}
          line={{ stroke: PATIENT_LINE_COLOR, strokeWidth: 2.2 }} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ── Per-chart card ────────────────────────────────────────────────────────────

function ChartCard({ title, type }) {
  const [showPercentiles, setShowPercentiles] = useState(false);
  const [showYears, setShowYears] = useState(true);

  const data = useMemo(() => {
    switch (type) {
      case "height": return toAgeAxisData(PATIENT_HEIGHT, PERCENTILES_HEIGHT);
      case "weight": return toAgeAxisData(PATIENT_WEIGHT, PERCENTILES_WEIGHT);
      case "bmi":    return toAgeAxisData(PATIENT_BMI,    PERCENTILES_BMI);
      case "ofc":    return toAgeAxisData(PATIENT_OFC,    PERCENTILES_OFC);
      default:       return [];
    }
  }, [type]);

  if (type === "hvw") {
    return (
      <ChartFrame
        title={title}
        showPercentiles={showPercentiles}
        onTogglePercentiles={setShowPercentiles}
        showYears={showYears}
        onToggleYears={setShowYears}>
        <HeightVsWeightChart showPercentiles={showPercentiles} />
      </ChartFrame>
    );
  }

  const meta = {
    height: { unit: "Height (cm)", domain: [40, 110] },
    weight: { unit: "Weight (kg)", domain: [0, 20] },
    bmi:    { unit: "BMI (kg/m²)", domain: [10, 22] },
    ofc:    { unit: "OFC (cm)", domain: [30, 56] },
  }[type] ?? { unit: "", domain: ["auto", "auto"] };

  return (
    <ChartFrame
      title={title}
      showPercentiles={showPercentiles}
      onTogglePercentiles={setShowPercentiles}
      showYears={showYears}
      onToggleYears={setShowYears}>
      <AgeAxisChart
        data={data}
        valueLabel={meta.unit}
        showPercentiles={showPercentiles}
        showYears={showYears}
        yDomain={meta.domain} />
    </ChartFrame>
  );
}

// ── Public ────────────────────────────────────────────────────────────────────

export function GrowthContent() {
  return (
    <div className="content-stretch flex flex-col items-center relative size-full">
      <ActionButton label="Add/Edit Details" icon="plus" sectionId="growth" />
      <HistoricalNewDataBanner activeId="growth" />
      <div className="flex-[1_0_0] min-h-px min-w-px overflow-y-auto relative w-full" data-sticky-scroll-root="true">
        <div className="content-stretch flex flex-col gap-[12px] items-center p-[12px] relative w-full">
          <GrowthInfoCard />
          <ChartCard title="Height for Age" type="height" />
          <ChartCard title="Weight for Age" type="weight" />
          <ChartCard title="BMI for Age" type="bmi" />
          <ChartCard title="Head Circumference (OFC) for Age" type="ofc" />
          <ChartCard title="Height vs Weight" type="hvw" />
        </div>
      </div>
    </div>
  );
}
