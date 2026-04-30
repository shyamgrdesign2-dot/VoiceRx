/**
 * Pure mappers from a `PatientHistory` (AI-payload-shaped) into the view
 * models that individual sidebar sections render.
 *
 * Adding a new section = add a new function here. Component code stays
 * declarative — pick a slice, render. Backend swap is a single edit in
 * `mock-payload.ts`.
 */

import {
  Diagnosis,
  Medication,
  MedicalHistoryEntry,
  PatientHistory,
  Symptom,
  VisitRecord,
  VitalsAndBodyComposition,
} from "./schema";

// ─── Vitals ───────────────────────────────────────────────────────────────────

export interface VitalRowVM {
  label: string;
  unit: string;
  value: string;
  /** Schema field name — useful when surfacing the raw field key in tooltips. */
  schemaKey: keyof VitalsAndBodyComposition;
}

export interface VitalsDateBlockVM {
  id: string;
  dateLabel: string;
  rows: VitalRowVM[];
}

interface VitalFieldDef {
  key: keyof VitalsAndBodyComposition;
  label: string;
  unit: string;
}

/**
 * Display order + units. Keep this list as the single declaration of which
 * vitals are shown, in what order, with what unit.
 */
const VITAL_FIELDS: VitalFieldDef[] = [
  { key: "temperature",        label: "Temperature", unit: "Frh"    },
  { key: "pulse",              label: "Pulse",       unit: "/min"   },
  { key: "respiratoryRate",    label: "Resp. Rate",  unit: "/min"   },
  { key: "systolic",           label: "Systolic",    unit: "mmhg"   },
  { key: "diastolic",          label: "Diastolic",   unit: "mmhg"   },
  { key: "spo2",               label: "SpO2",        unit: "%"      },
  { key: "randomBloodSugar",   label: "RBS",         unit: "mg/dL"  },
  { key: "height",             label: "Height",      unit: "cms"    },
  { key: "weight",             label: "Weight",      unit: "kgs"    },
  { key: "bmi",                label: "BMI",         unit: "kg/m²"  },
  { key: "bmr",                label: "BMR",         unit: "kcals"  },
  { key: "bsa",                label: "BSA",         unit: "m²"     },
  { key: "headCircumference",  label: "Head Circ.",  unit: "cms"    },
  { key: "waistCircumference", label: "Waist Circ.", unit: "cms"    },
  { key: "fib4",               label: "FIB-4",       unit: ""       },
];

function vitalsBlockFromVisit(visit: VisitRecord): VitalsDateBlockVM {
  const v = visit.payload.vitalsAndBodyComposition;
  const rows: VitalRowVM[] = VITAL_FIELDS.flatMap((field) => {
    const value = v[field.key];
    if (typeof value !== "string" || !value.trim()) return [];
    return [{ label: field.label, unit: field.unit, value, schemaKey: field.key }];
  });
  return { id: visit.id, dateLabel: visit.dateLabel, rows };
}

export function vitalsByDate(history: PatientHistory): VitalsDateBlockVM[] {
  return history.visits
    .map(vitalsBlockFromVisit)
    .filter((block) => block.rows.length > 0);
}

// ─── Medical history ──────────────────────────────────────────────────────────

export interface HistoryItemVM {
  name: string;
  detail?: string;
}

export interface HistorySectionVM {
  id: string;
  title: string;
  items: HistoryItemVM[];
}

const HISTORY_SECTION_ORDER: Array<{
  id: string;
  title: string;
  type: MedicalHistoryEntry["type"];
}> = [
  { id: "medical",    title: "Medical Conditions", type: "Medical condition" },
  { id: "allergies",  title: "Allergies",          type: "Allergies"         },
  { id: "family",     title: "Family History",     type: "Family History"    },
  { id: "surgical",   title: "Surgical History",   type: "Surgical History"  },
  { id: "lifestyle",  title: "Lifestyle",          type: "Lifestyle"         },
  { id: "additional", title: "Additional History", type: "Additional Notes"  },
];

/**
 * Build "X year(s) | Active | <notes>" detail line from a schema entry.
 * Family entries lead with the relation instead.
 */
function historyDetailFor(entry: MedicalHistoryEntry): string | undefined {
  if (entry.type === "Family History") {
    return valueDetail([entry.relation, entry.notes]) || undefined;
  }
  // "Active" / "Negated" only meaningful for chronic-style entries.
  const showsStatus =
    entry.type === "Medical condition" ||
    entry.type === "Allergies" ||
    entry.type === "Lifestyle";
  const status =
    showsStatus && entry.enable === "N"
      ? "Negated"
      : showsStatus && entry.enable === "Y"
        ? "Active"
        : "";
  return valueDetail([entry.duration, status, entry.notes]) || undefined;
}

export function historySections(history: PatientHistory): HistorySectionVM[] {
  // Aggregate medicalHistory across ALL visits (newer entries win on duplicate name+type).
  const byKey = new Map<string, MedicalHistoryEntry>();
  history.visits.forEach((visit) => {
    visit.payload.medicalHistory.forEach((entry) => {
      const key = `${entry.type}::${entry.name.toLowerCase()}`;
      byKey.set(key, entry);
    });
  });
  const aggregated = [...byKey.values()];

  return HISTORY_SECTION_ORDER.map(({ id, title, type }) => ({
    id,
    title,
    items: aggregated
      .filter((entry) => entry.type === type)
      .map((entry) => ({ name: entry.name, detail: historyDetailFor(entry) })),
  }));
}

// ─── Past visits — digital Rx slice ───────────────────────────────────────────

export interface VisitListItemVM {
  label: string;
  detail: string;
}

export interface VisitMedicationVM extends VisitListItemVM {
  row: {
    medicine: string;
    unitPerDose: string;
    frequency: string;
    when: string;
    duration: string;
    note: string;
  };
}

export interface DigitalVisitVM {
  symptoms: VisitListItemVM[];
  examinations: VisitListItemVM[];
  diagnoses: VisitListItemVM[];
  medications: VisitMedicationVM[];
  advice: string;
  followUp: string;
  labInvestigations: string[];
  vitals: {
    bpSystolic?: string;
    bpDiastolic?: string;
    temperature?: string;
    heartRate?: string;
    respiratoryRate?: string;
    weight?: string;
  };
  additionalNotes: string;
}

/**
 * Two detail formatters reflecting the visual contract:
 *
 * - `valueDetail`  → "value | value | value"   used for list-type sections
 *   (symptoms, diagnoses, medications, history items, etc.) where the
 *   field meaning is implicit from the section title. Empty values dropped.
 *
 * - `labelledDetail` → "Label: value | Label: value"  used for object-type
 *   sections (gynec, obstetric, antenatal exam) where labels are essential
 *   for disambiguation.
 *
 * Both filter empties per the schema's "leave empty if not present"
 * semantics. Numeric `0` is treated as "not mentioned" since the schema
 * uses 0 as the sentinel for missing numeric fields.
 */
function isPresent(v: string | number | undefined | null): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (s === "0") return false;
  return true;
}

function valueDetail(values: Array<string | number | undefined | null>): string {
  return values.filter(isPresent).map((v) => String(v).trim()).join(" | ");
}

function labelledDetail(pairs: Array<[string, string | number | undefined | null]>): string {
  return pairs
    .filter(([, v]) => isPresent(v))
    .map(([label, v]) => `${label}: ${String(v).trim()}`)
    .join(" | ");
}

function symptomToItem(s: Symptom): VisitListItemVM {
  return {
    label: s.name,
    detail: valueDetail([s.duration, s.severity, s.notes]),
  };
}

function diagnosisToItem(d: Diagnosis): VisitListItemVM {
  return {
    label: d.name,
    detail: valueDetail([d.since, d.status, d.notes]),
  };
}

function medicationToItem(m: Medication): VisitMedicationVM {
  return {
    label: m.name,
    detail: valueDetail([m.dosage, m.frequency, m.schedule, m.duration, m.notes, m.quantity]),
    row: {
      medicine: m.name,
      unitPerDose: m.dosage,
      frequency: m.frequency,
      when: m.schedule,
      duration: m.duration,
      note: m.notes,
    },
  };
}

export interface PastVisitVM {
  id: string;
  dateLabel: string;
  digitalRx?: DigitalVisitVM;
  writtenRx: NonNullable<VisitRecord["attachments"]>;
}

export function pastVisits(history: PatientHistory): PastVisitVM[] {
  return history.visits.map((visit) => {
    const p = visit.payload;
    const hasDigitalContent =
      p.symptoms.length || p.examinations.length || p.diagnosis.length || p.medications.length;

    const digitalRx: DigitalVisitVM | undefined = hasDigitalContent
      ? {
          symptoms: p.symptoms.map(symptomToItem),
          examinations: p.examinations.map((e) => ({
            label: e.name,
            detail: valueDetail([e.notes]),
          })),
          diagnoses: p.diagnosis.map(diagnosisToItem),
          medications: p.medications.map(medicationToItem),
          advice: p.advice.join(" "),
          followUp: p.followUp ? `After ${p.followUp}` : "",
          labInvestigations: p.labInvestigation.map((li) => li.name).filter(Boolean),
          vitals: {
            bpSystolic: p.vitalsAndBodyComposition.systolic || undefined,
            bpDiastolic: p.vitalsAndBodyComposition.diastolic || undefined,
            temperature: p.vitalsAndBodyComposition.temperature || undefined,
            heartRate: p.vitalsAndBodyComposition.pulse || undefined,
            respiratoryRate: p.vitalsAndBodyComposition.respiratoryRate || undefined,
            weight: p.vitalsAndBodyComposition.weight || undefined,
          },
          additionalNotes: p.others.join(" "),
        }
      : undefined;

    return {
      id: visit.id,
      dateLabel: visit.dateLabel,
      digitalRx,
      writtenRx: visit.attachments ?? [],
    };
  });
}
