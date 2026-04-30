/**
 * Digitization Prescription Schema — TypeScript mirror of the
 * `DIGITIZATION_PRESCRIPTION_FIELDS` JSON contract used by the AI extraction
 * pipeline. The shape here is intentionally identical to the backend payload
 * so a future API response can be assigned directly to `DigitizationPrescription`
 * without any reshaping in the UI layer.
 *
 * All string fields default to "" when the AI cannot extract them (per the
 * schema description: "Leave empty if not present"). Arrays default to [].
 */

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  notes: string;
}

// ─── Vitals & body composition ────────────────────────────────────────────────

export interface VitalsAndBodyComposition {
  temperature: string;
  pulse: string;
  respiratoryRate: string;
  bloodPressure: string;
  systolic: string;
  diastolic: string;
  spo2: string;
  randomBloodSugar: string;
  height: string;
  weight: string;
  headCircumference: string;
  waistCircumference: string;
  bmi: string;
  bmr: string;
  bsa: string;
  fib4: string;
  generalRBS: string;
}

// ─── Clinical lists ───────────────────────────────────────────────────────────

export interface Symptom {
  name: string;
  duration: string;
  severity: string;
  notes: string;
}

export interface Examination {
  name: string;
  notes: string;
}

export type DiagnosisStatus = "Ruled out" | "Suspected" | "Confirmed" | "";

export interface Diagnosis {
  name: string;
  since: string;
  status: DiagnosisStatus;
  notes: string;
}

export interface Medication {
  name: string;
  frequency: string;
  dosage: string;
  schedule: string;
  duration: string;
  notes: string;
  quantity: number;
}

export interface Vaccination {
  name: string;
  brand: string;
  schedule: string;
  notes: string;
}

export interface Surgery {
  name: string;
  notes: string;
}

export interface LabResult {
  testname: string;
  value: string;
  notes: string;
}

export type MedicalHistoryType =
  | "Allergies"
  | "Lifestyle"
  | "Family History"
  | "Medical condition"
  | "Surgical History"
  | "Additional Notes"
  | "";

export interface MedicalHistoryEntry {
  name: string;
  type: MedicalHistoryType;
  duration: string;
  relation: string;
  /** "Y" = present, "N" = explicitly negated. */
  enable: "Y" | "N" | "";
  notes: string;
}

// ─── Gynec ────────────────────────────────────────────────────────────────────

export interface GyneacHistory {
  lastMenstrualPeriod: string;
  ageAtMenarche: number;
  cycle: string;
  intervalCycle: number;
  intervalNotes: string;
  flow: string;
  durationOfMenstrualFlow: number;
  clotsDuringFlow: string;
  numberOfPadsPerDay: number;
  clotsNotes: string;
  pain: string;
  occurrenceOfPain: string;
  painNotes: string;
  lifecycleHarmonialChanges: string;
  ageAtMenopause: number;
  typeOfMenopause: string;
  lifecycleHarmonialChangesNotes: string;
  notes: string;
}

// ─── Obstetric ────────────────────────────────────────────────────────────────

export interface PastPregnancy {
  gravidaNumber: number;
  outcome: "Live" | "Miscarriage" | "Still birth" | "Ectopic" | "";
  termLength: string;
  birthInfoType: "DOD" | "Age" | "";
  dateOfDelivery: string;
  ageAtDeliveryYears: number;
  ageAtDeliveryMonths: number;
  modeOfDelivery: "LSCS" | "FTND" | "PTVD" | "";
  babyGender: "Male" | "Female" | "";
  babyWeight: string;
  remarks: string;
  periodOfGAWeeks: number;
  location: string;
  modeOfManagement: string;
}

export interface AntenatalExam {
  date: string;
  pallor: "Yes" | "No" | "";
  oedema: "Yes" | "No" | "";
  motherHeight: string;
  motherWeight: string;
  bmi: string;
  bloodPressure: string;
  systolic: string;
  fundalHeight: string;
  foetalHeartRate: string;
  presentation: "Breech" | "Cephalic" | "Variable" | "Transverse" | "EB" | "";
  liquor: "Normal" | "Less" | "More" | "";
  notes: string;
}

export interface AncEntry {
  type: "First Trimester" | "Second Trimester" | "Third Trimester" | "";
  testName: string;
  weekRange: string;
  dueDate: string;
  status: "Due" | "Completed" | "";
  remarks: string;
}

export interface Immunisation {
  vaccineName: string;
  status: "Due" | "Given" | "";
  date: string;
  notes: string;
}

export interface ObstetricHistory {
  gravidity: number;
  parity: number;
  livingChildren: number;
  abortions: number;
  ectopicPregnancies: number;
  lastMenstrualPeriod: string;
  expectedDateOfDelivery: string;
  calculatedExpectedDateOfDelivery: string;
  gestationWeeks: number;
  gestationDays: number;
  bloodGroup: string;
  husbandsBloodGroup: string;
  consanguineousMarriage: "Yes" | "No" | "";
  maritalStatus: string;
  marriageDurationYears: number;
  marriageDurationMonths: number;
  pastPregnancyDetails: PastPregnancy[];
  antenatalExamination: AntenatalExam[];
  ancHistory: AncEntry[];
  immunisationHistory: Immunisation[];
  diagnosisNotes: string;
}

// ─── Investigations / advice / dynamic ────────────────────────────────────────

export interface LabInvestigation {
  name: string;
  instruction: string;
  notes: string;
}

export interface DynamicField {
  title: string;
  notes: string;
}

// ─── Top-level prescription (one visit's AI extraction) ───────────────────────

export interface DigitizationPrescription {
  patientDetails: PatientDetails;
  vitalsAndBodyComposition: VitalsAndBodyComposition;
  symptoms: Symptom[];
  examinations: Examination[];
  diagnosis: Diagnosis[];
  medications: Medication[];
  vaccinations: Vaccination[];
  surgeries: Surgery[];
  labResults: LabResult[];
  medicalHistory: MedicalHistoryEntry[];
  gyneacHistory: GyneacHistory;
  obstetricHistory: ObstetricHistory;
  advice: string[];
  labInvestigation: LabInvestigation[];
  followUp: string;
  others: string[];
  dynamicFields: DynamicField[];
}

// ─── Patient history (many visits) ────────────────────────────────────────────

/**
 * One stored visit. The `payload` matches the AI extraction schema exactly so
 * backend payloads slot in untouched. `dateLabel` is a UI-friendly label
 * derived once at ingest time.
 */
export interface VisitRecord {
  id: string;
  /** Display label, e.g. "Today (27 Jan'26)" or "26 Jan'26". */
  dateLabel: string;
  /** Whether this is the active/current visit (drives "Today" framing). */
  isCurrent?: boolean;
  payload: DigitizationPrescription;
  /**
   * Optional extras that don't live in the AI schema today but are part of
   * the patient record (e.g. a scanned written prescription PDF).
   */
  attachments?: WrittenPrescriptionAttachment[];
}

export interface WrittenPrescriptionAttachment {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  previewImage: string;
}

export interface PatientHistory {
  visits: VisitRecord[];
}

// ─── Empty defaults ───────────────────────────────────────────────────────────

export const EMPTY_VITALS: VitalsAndBodyComposition = {
  temperature: "",
  pulse: "",
  respiratoryRate: "",
  bloodPressure: "",
  systolic: "",
  diastolic: "",
  spo2: "",
  randomBloodSugar: "",
  height: "",
  weight: "",
  headCircumference: "",
  waistCircumference: "",
  bmi: "",
  bmr: "",
  bsa: "",
  fib4: "",
  generalRBS: "",
};

export const EMPTY_GYNEC: GyneacHistory = {
  lastMenstrualPeriod: "",
  ageAtMenarche: 0,
  cycle: "",
  intervalCycle: 0,
  intervalNotes: "",
  flow: "",
  durationOfMenstrualFlow: 0,
  clotsDuringFlow: "",
  numberOfPadsPerDay: 0,
  clotsNotes: "",
  pain: "",
  occurrenceOfPain: "",
  painNotes: "",
  lifecycleHarmonialChanges: "",
  ageAtMenopause: 0,
  typeOfMenopause: "",
  lifecycleHarmonialChangesNotes: "",
  notes: "",
};

export const EMPTY_OBSTETRIC: ObstetricHistory = {
  gravidity: 0,
  parity: 0,
  livingChildren: 0,
  abortions: 0,
  ectopicPregnancies: 0,
  lastMenstrualPeriod: "",
  expectedDateOfDelivery: "",
  calculatedExpectedDateOfDelivery: "",
  gestationWeeks: 0,
  gestationDays: 0,
  bloodGroup: "",
  husbandsBloodGroup: "",
  consanguineousMarriage: "",
  maritalStatus: "",
  marriageDurationYears: 0,
  marriageDurationMonths: 0,
  pastPregnancyDetails: [],
  antenatalExamination: [],
  ancHistory: [],
  immunisationHistory: [],
  diagnosisNotes: "",
};

export function emptyPrescription(): DigitizationPrescription {
  return {
    patientDetails: { name: "", age: "", gender: "", bloodGroup: "", notes: "" },
    vitalsAndBodyComposition: { ...EMPTY_VITALS },
    symptoms: [],
    examinations: [],
    diagnosis: [],
    medications: [],
    vaccinations: [],
    surgeries: [],
    labResults: [],
    medicalHistory: [],
    gyneacHistory: { ...EMPTY_GYNEC },
    obstetricHistory: { ...EMPTY_OBSTETRIC },
    advice: [],
    labInvestigation: [],
    followUp: "",
    others: [],
    dynamicFields: [],
  };
}
