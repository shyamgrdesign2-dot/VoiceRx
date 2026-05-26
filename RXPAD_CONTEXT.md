# RxPad — Complete Module & Data Reference

> **Purpose of this document:** Provide a complete, standalone description of the TatvaPractice RxPad consultation workspace — every module, every data field, every option set — so another session, agent, or developer can understand the full data model and structure without access to the codebase.

---

## What is the RxPad?

The RxPad is the prescription-writing pad at the heart of the consultation workspace. It is the **right-side panel** of a split-screen layout used by doctors during a consultation. The left side shows historical patient data (past visits, vitals, labs, etc. — the "secondary sidebar"). The RxPad itself is where the doctor records the current visit's clinical information and generates the prescription.

The RxPad is composed of **ordered, configurable sections**. Each section is an independent module. The doctor can reorder them, enable/disable them, and add their own custom modules. Every section has:

- A title and section icon (violet-coloured medical icon from the TP icon system)
- A header action bar: **Voice** (dictation), **Template** (save/load presets), **Clear**, and a voice-added count badge
- A body — either an **editable table** (most sections) or a **free-text area** (Additional Notes, Follow-up)

---

## Section Architecture

### Built-in sections (in default render order)

| # | Section ID | Display Title | Input Type |
|---|---|---|---|
| 1 | `symptoms` | Symptoms | Editable table |
| 2 | `examinations` | Examinations | Editable table |
| 3 | `diagnosis` | Diagnosis | Editable table |
| 4 | `medication` | Medication (Rx) | Editable table |
| 5 | `advice` | Advices | Editable table |
| 6 | `lab` | Lab Investigation | Editable table |
| 7 | `surgery` | Surgery | Editable table |
| 8 | `additionalNotes` | Additional Notes | Free-text textarea |
| 9 | `followUp` | Follow-up | Date picker + quick-select chips + free-text |
| — | `custom:<uuid>` | Doctor-defined name | Editable table (dynamic columns) |

All sections are **enabled by default** and appear in the above order unless the doctor customises via the "Customise Your Pad" sidebar. The doctor can toggle any section on/off and drag to reorder. Custom modules (up to 15) are appended after the built-in sections.

---

## Section-by-Section Data Model

---

### 1. Symptoms

**Purpose:** Record the patient's current presenting complaints.

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `name` | SYMPTOM NAME | Free text + autocomplete | Open search. Common suggestions: "Chest Pain", "Fever", "Headache", "Cough", "Running Nose", "Sore Throat", "Fatigue", "Dizziness", "Nausea", "Joint Pain", "Back Pain", "Shortness of Breath", "Skin Rash", "Vomiting", "Abdominal Pain", "Frequent Urination", "Muscle Aches", "Loss of Appetite", "Changes in Vision", "Diarrhea" |
| `since` | SINCE | Constrained options | Generated durations: "1 hour", "2 hours", "3 hours", "6 hours", "12 hours", "1 day", "2 days", "3 days", "4 days", "5 days", "1 week", "2 weeks", "1 month", "3 months", "6 months", "1 year", "2 years". Seeded from whatever the doctor types (e.g. typing "3" offers "3 days", "3 weeks", "3 months"). |
| `status` | STATUS | Constrained options | `Severe` / `Moderate` / `Mild` |
| `note` | NOTE | Multiline free text (max 2 lines) | Any additional notes |

**Row shape (data object):**
```json
{
  "id": "symptoms_1719123456789_abc",
  "name": "Headache",
  "since": "3 days",
  "status": "Moderate",
  "note": ""
}
```

**AI features on this section:**
- After symptoms are filled, an "AI Trigger Chip" appears in the search bar: **"Suggest DDX"** — triggers Dr. Agent to generate a differential diagnosis based on the entered symptoms. On click, the page scrolls to the Diagnosis section.
- Voice dictation supported: doctor speaks symptoms, they are parsed and rows are auto-populated.

**Canned chips (quick-add):** First 12 of the symptomSuggestions list shown as chips below the search bar.

---

### 2. Examinations

**Purpose:** Record clinical examination findings.

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `name` | EXAMINATION NAME | Free text + autocomplete | Open search. Common suggestions: "Throat Congested", "Bilateral Air Entry Equal", "Soft Non-Tender Abdomen", "Lymphadenopathy", "Edema", "Chest Discomfort" (plus overlapping with symptom suggestions for physical findings) |
| `note` | NOTE | Multiline free text (max 2 lines) | Any additional detail |

**Row shape:**
```json
{
  "id": "examinations_1719123456789_abc",
  "name": "Throat — Congested, mild erythema",
  "note": ""
}
```

**Notes:** Only two columns — the examination finding is free-form. No severity grading or duration. Voice dictation supported.

---

### 3. Diagnosis

**Purpose:** Record the doctor's clinical diagnosis (or differential diagnoses).

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `name` | DIAGNOSIS NAME | Free text + autocomplete | Open search. Extensive built-in catalog including: "Acute Upper Respiratory Infection", "Viral Pharyngitis", "Common Cold", "Type 2 Diabetes Mellitus", "Essential Hypertension", "Acute Bronchitis", "Contact Dermatitis", "Urinary Tract Infection", "Gastroenteritis", "Migraine", "Allergic Rhinitis", "Iron Deficiency Anemia", "Viral Fever", "Dengue Fever", "Hypothyroidism", "Osteoarthritis", "Gout", "Rheumatoid Arthritis", and dozens more across specialties |
| `since` | SINCE | Constrained options | Same duration generator as Symptoms |
| `status` | STATUS | Constrained options | `Suspected` / `Confirmed` / `Ruled Out` |
| `note` | NOTE | Multiline free text (max 2 lines) | Clinical note |

**Row shape:**
```json
{
  "id": "diagnosis_1719123456789_abc",
  "name": "Tension-type Headache",
  "since": "3 days",
  "status": "Confirmed",
  "note": ""
}
```

**AI features on this section:**
- Each diagnosis option in the dropdown shows a **DDx % match** tag (gradient violet pill, e.g. "DDx 78% match") when Dr. Agent has suggested a differential. The percentage reflects relevance to the AI-generated differential based on current symptoms.
- After diagnosis rows are filled: **"Suggest lab tests"** AI Trigger Chip appears — triggers Dr. Agent to suggest investigations.
- Voice dictation supported.

---

### 4. Medication (Rx)

**Purpose:** Write prescriptions — the core of the RxPad.

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `medicine` | MEDICINE NAME | Free text + autocomplete | Open search with drug catalog. Common: "Paracetamol 650mg", "Amoxicillin 500mg", "Pantoprazole 40mg", "Cetirizine 10mg", "Ondansetron 4mg", "Dolo 650", "Ibuprofen 400mg", "Levocetirizine 5mg", "Montelukast 10mg", "ORS Sachet", "Metformin 500mg", "Amlodipine 5mg" etc. |
| `unitPerDose` | UNIT PER DOSE | Constrained options | Generated options: "1 tablet", "2 tablets", "½ tablet", "1 capsule", "1 sachet", "5 ml", "10 ml", "1 puff", "2 puffs", "1 drop", "2 drops", "As directed" (seeded from input) |
| `frequency` | FREQUENCY | Constrained options | Includes standard Indian pharmacy notation: "1-0-1" (twice daily), "1-1-1" (thrice daily), "0-0-1" (once at night), "1-0-0" (once in morning), "0-1-0" (once at noon), "SOS" (as needed), "BD", "TDS", "OD", "QID", plus English labels |
| `when` | WHEN | Constrained options | "Before Breakfast", "After Breakfast", "Before Lunch", "After Lunch", "Before Dinner", "After Dinner", "Before Food", "After Food", "With Food" |
| `duration` | DURATION | Constrained options | Generated: "1 day", "2 days", "3 days", "5 days", "7 days / 1 week", "10 days", "14 days / 2 weeks", "1 month", "3 months", "6 months", "Continue" (seeded from input) |
| `note` | NOTE | Multiline free text (max 2 lines) | Instructions, substitution notes, special instructions |

**Row shape:**
```json
{
  "id": "medication_1719123456789_abc",
  "medicine": "Paracetamol 650mg",
  "unitPerDose": "1 tablet",
  "frequency": "1-0-1",
  "when": "After Food",
  "duration": "5 days",
  "note": ""
}
```

**AI & safety features:**
- **Drug-Allergy Check:** Cross-references each newly added medicine against the patient's documented allergies. If a match is found (e.g. Amoxicillin added when patient has Penicillin allergy), an inline warning banner appears. Allergy map includes: ibuprofen/NSAIDs, sulfa drugs, aspirin/salicylates, penicillin-class antibiotics.
- **Drug-Drug Interaction (DDI) Check:** Each medication option in the dropdown shows a **"DDI match"** violet tag if it potentially interacts with an already-added medication. Interacting rows are highlighted in the table with a tooltip explaining the interaction.
- **Ungrounded rows:** When VoiceRx or Dr. Agent adds medications, rows that haven't been confirmed/verified by the doctor are marked as "ungrounded" with a visual indicator.
- **"Check interactions"** AI Trigger Chip appears after medications are filled.
- **Canned chips:** Paracetamol 650mg, Amoxicillin 500mg, Pantoprazole 40mg, Cetirizine 10mg, Ondansetron 4mg, ORS Sachet, Multivitamin, Ibuprofen 400mg.
- Voice dictation supported.

---

### 5. Advices

**Purpose:** Record doctor's advice, lifestyle instructions, and patient counselling points.

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `advice` | ADVICE NAME | Free text + autocomplete (wide) | Open search. Built-in suggestions: "Stay hydrated daily", "Take steam inhalation", "Avoid oily foods", "Complete medication course", "Monitor blood pressure", "Regular morning walk", "Salt restricted diet", "Follow sleep hygiene" |
| `note` | NOTE | Multiline free text (max 2 lines) | Additional context |

**Row shape:**
```json
{
  "id": "advice_1719123456789_abc",
  "advice": "Avoid prolonged screen time. Maintain good posture.",
  "note": ""
}
```

**AI features:** After advice rows are filled, **"Translate advice"** AI Trigger Chip — triggers Dr. Agent to translate advice into the patient's preferred language. Advice column is wide (420px default) to accommodate full sentences.

---

### 6. Lab Investigation

**Purpose:** Order diagnostic tests and investigations.

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `investigation` | INVESTIGATION NAME | Free text + autocomplete (wide) | Open search. Base catalog: "Complete Blood Count", "Liver Function Test", "Renal Function Test", "Lipid Profile", "Thyroid Profile", "HbA1c", "Fasting Blood Sugar", "Urine Routine", "Chest X-Ray", "ECG", "USG Abdomen" |
| `note` | NOTE | Multiline free text (max 2 lines) | Special instructions (e.g. "Fasting sample required") |

**Row shape:**
```json
{
  "id": "lab_1719123456789_abc",
  "investigation": "Complete Blood Count (CBC)",
  "note": "Fasting sample required"
}
```

**AI features:**
- Each investigation option in the dropdown shows a **"Investigation X% match"** violet tag when a diagnosis is present — reflects AI relevance against the current diagnosis list.
- **"Suggest investigations"** AI Trigger Chip appears after diagnosis is filled.
- Ungrounded row tracking (same as Medication) for AI-added rows.
- Voice dictation supported.

---

### 7. Surgery

**Purpose:** Record planned surgical procedures or surgical orders. Specialty-specific (not visible by default in general practice; enabled for surgical specialties).

**Table columns:**

| Column key | Display label | Type | Options / Format |
|---|---|---|---|
| `surgery` | SURGERY NAME | Free text + autocomplete (wide) | Open search. Built-in suggestions: "Laparoscopic Appendectomy", "Tonsillectomy", "Sinus Endoscopy", "Thoracic Relief Procedure", "Pulmonary Enhancement Surgery", "Abdominal Reconstruction Surgery", "Urological Restoration Procedure", "Articular Repair Surgery" |
| `note` | NOTE | Multiline free text (max 2 lines) | Pre-op instructions, consent notes |

**Row shape:**
```json
{
  "id": "surgery_1719123456789_abc",
  "surgery": "Laparoscopic Appendectomy",
  "note": ""
}
```

---

### 8. Additional Notes

**Purpose:** Free-form field for patient-specific notes, observations, counselling points, or anything the doctor wants to record outside the structured fields.

**Input type:** Single `<textarea>` — no table, no columns.

**Data shape:**
```
additionalNotes: string  // plain text, multi-line
```

**Example content:**
```
Patient advised to revisit if fever persists beyond 3 days.
Counselled regarding blood pressure monitoring at home.
Referred to cardiologist for further evaluation if chest pain recurs.
```

**AI features:** Voice dictation supported — VoiceRx transcript flows directly into this field.

---

### 9. Follow-up

**Purpose:** Schedule the patient's next appointment and record follow-up instructions.

**Input type:** Hybrid — a date picker + quick-select chips + optional free-text notes textarea.

**Data shape:**
```
followUpDate: string  // ISO date "YYYY-MM-DD"
followUpNotes: string // free text
```

**Quick-select chips (inline date shortcuts):**
- 2 days
- 1 week
- 1 month
- 3 months

Clicking a chip auto-calculates and sets the date relative to today.

**Example:**
```json
{
  "followUpDate": "2025-07-01",
  "followUpNotes": "Review lab results. Check HbA1c and lipid panel."
}
```

**AI features:** Voice dictation supported — VoiceRx parses "follow up in one week" and populates the date automatically.

---

### 10. Custom Modules

**Purpose:** Doctor-defined tables for specialties or workflows not covered by built-in sections. Up to 15 custom modules can be created. Each module is created through the Custom Modules Drawer.

**Module definition shape:**
```json
{
  "id": "mod_1719123456789_abc",
  "name": "Ophthal Findings",
  "fields": [
    { "id": "field_001", "label": "Eye", "kind": "text" },
    { "id": "field_002", "label": "Vision", "kind": "text" },
    { "id": "field_003", "label": "IOP", "kind": "text" }
  ],
  "createdAt": 1719123456789,
  "iconName": "Eye",
  "iconStyle": "bulk",
  "iconSvg": null
}
```

**Runtime row shape** (mirrors built-in tables):
```json
{
  "id": "custom_1719123456789_abc",
  "field_001": "Right",
  "field_002": "6/6",
  "field_003": "14 mmHg"
}
```

**Key behaviours:**
- Each column has its own suggestion history, built from all rows previously entered for that column (per-patient, persisted in localStorage under key `rxpad:custom:<moduleId>:<patientId>`).
- Typing any value offers "Add custom: [typed text]" as a first-time option — no pre-seeded catalog.
- No search bar — uses "+ Add new line" link pattern instead of the search-based entry of built-in modules.
- Voice dictation supported per module.
- Sections are rendered under their section id `custom:<moduleId>` in the config.

---

## Editable Table — Universal Mechanics

Every table-based section shares the same interaction model:

**Row interactions:**
- Click any cell → opens an inline dropdown with type-ahead search
- Dropdown shows filtered options from that column's catalog
- Selecting an option fills the cell and moves focus to the next column
- `Enter` / `Tab` confirms and advances
- Click outside closes the dropdown and commits

**Row management:**
- Search bar at the top of each section (or "+ Add new line" for custom modules) — type to search and add a new row
- Canned chips below the search bar (built-in sections only) — click to instantly add a row
- Each row has a drag handle (left) for reordering
- Each row has a delete (×) button (right) — appears on hover

**Header toolbar (every section):**
- 🎤 **Voice** — activates VoiceRx module recorder for that section
- 📋 **Template** — opens template picker (load saved presets, or save current rows as a new template)
- 💾 **Save** — saves current rows as a template (enabled only when rows have content)
- 🗑 **Clear** — removes all rows (enabled only when rows have content)
- Voice count badge — shows number of rows added via the current VoiceRx session (e.g. "+3")

---

## Historical Patient Data (Secondary Sidebar)

The sidebar on the left of the consultation workspace shows historical data pulled from the patient's record. This is **read-only reference data** — doctors can copy items from here into the RxPad with a single click.

### Past Visits

Each past visit record contains:

```json
{
  "id": "pv-1",
  "date": "2025-06-24",
  "visitType": "OPD",
  "doctorName": "Dr. Ananya Sharma",
  "speciality": "General Medicine",
  "symptoms": ["Fever", "Headache", "Body ache", "Sore throat"],
  "examination": [
    "Throat — Congested, mild erythema",
    "Chest — Clear, bilateral air entry equal"
  ],
  "diagnosis": ["Acute Upper Respiratory Infection", "Viral Pharyngitis"],
  "medications": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 Tab",
      "frequency": "1-0-1",
      "duration": "5 Days"
    }
  ],
  "advices": ["Warm saline gargles thrice daily", "Plenty of fluids"],
  "followUp": "5 Days",
  "notes": "Patient advised to revisit if fever persists beyond 3 days"
}
```

The doctor can copy any section from a past visit (symptoms, diagnosis, medications, etc.) directly into the current RxPad session. Visit types include OPD, Teleconsult, IPD.

---

### Vitals

Each vitals entry is timestamped and contains all or a subset of:

```json
{
  "id": "v-1",
  "date": "2025-06-24",
  "bloodPressure": { "systolic": 128, "diastolic": 82, "status": "normal" },
  "temperature": { "value": 99.2, "unit": "F", "status": "warning" },
  "heartRate": { "value": 88, "status": "normal" },
  "respiratoryRate": { "value": 18, "status": "normal" },
  "spO2": { "value": 97, "status": "normal" },
  "weight": { "value": 72, "unit": "kg" },
  "height": { "value": 175, "unit": "cm" },
  "bmi": { "value": 23.5, "status": "normal" }
}
```

**Status values:** `normal` / `warning` / `critical` / `low`

**Visual colour coding:**
- `normal` → green (`tp-success-600` on `tp-success-50`)
- `warning` → amber (`tp-warning-600` on `tp-warning-50`)
- `critical` → red (`tp-error-600` on `tp-error-50`)
- `low` → blue (`tp-blue-600` on `tp-blue-50`)

Multiple vitals entries exist (one per visit). Displayed as a timeline; most recent is shown first.

---

### Medical History

History is a single comprehensive record with four sub-sections:

**Allergies:**
```json
{
  "id": "a-1",
  "allergen": "Penicillin",
  "type": "Drug",
  "severity": "severe",
  "reaction": "Anaphylaxis — Difficulty breathing, swelling of face and throat",
  "reportedDate": "2020-03-15"
}
```
Types: `Drug` / `Food` / `Environmental`
Severity: `mild` / `moderate` / `severe`
Severe allergies are always shown prominently in red; they are cross-checked against medication entries in real time.

**Chronic Conditions:**
```json
{
  "id": "cc-1",
  "condition": "Type 2 Diabetes Mellitus",
  "diagnosedDate": "2021-06-15",
  "status": "Active",
  "medications": ["Metformin 500mg BD"],
  "notes": "HbA1c last checked: 6.8% (Mar 2025)"
}
```

**Surgical History:**
```json
{
  "id": "sh-1",
  "procedure": "Appendectomy",
  "date": "2018-11-20",
  "hospital": "City General Hospital",
  "outcome": "Uneventful recovery"
}
```

**Family History:**
```json
{
  "id": "fh-1",
  "relation": "Father",
  "condition": "Type 2 Diabetes Mellitus",
  "ageOfOnset": "45 years",
  "status": "Living"
}
```
Relation examples: Father, Mother, Paternal/Maternal Grandparent, Sibling
Status: `Living` / `Deceased`

**Social History:**
```json
{
  "smoking": { "status": "Never" },
  "alcohol": { "status": "Occasional", "details": "Social drinking, 1-2 drinks per month" },
  "occupation": "Software Engineer",
  "exercise": "Moderate — walks 30 min daily",
  "diet": "Mixed — vegetarian on weekdays"
}
```

---

### Ophthal (Ophthalmology)

Specialty panel. Each entry contains:

```json
{
  "id": "oph-1",
  "date": "2025-04-10",
  "vision": [
    { "eye": "Right", "unaided": "6/12", "withGlasses": "6/6", "pinhole": "6/6", "nearVision": "N6" },
    { "eye": "Left",  "unaided": "6/9",  "withGlasses": "6/6", "pinhole": "6/6", "nearVision": "N6" }
  ],
  "iop": { "right": 14, "left": 16, "method": "Non-contact tonometry" },
  "anteriorSegment": { "right": "Normal", "left": "Normal" },
  "posteriorSegment": { "right": "Normal fundus, CDR 0.3", "left": "Normal fundus, CDR 0.3" },
  "diagnosis": ["Myopia — Right eye", "Mild Myopia — Left eye"],
  "treatment": ["Corrective lenses prescribed"],
  "notes": "Annual review recommended"
}
```

---

### Gynec (Gynaecology)

Specialty panel. Each entry contains:

```json
{
  "id": "gyn-1",
  "date": "2025-02-20",
  "menstrualHistory": {
    "lmp": "2025-02-05",
    "cycleLength": 28,
    "duration": 5,
    "regularity": "Regular",
    "flow": "Moderate",
    "dysmenorrhea": true,
    "notes": "Mild cramping on day 1-2"
  },
  "papSmear": { "date": "2024-12-15", "result": "Normal — No abnormal cells detected" },
  "contraception": "Oral contraceptive pills",
  "complaints": ["Mild dysmenorrhea"],
  "diagnosis": ["Primary Dysmenorrhea"],
  "treatment": ["Mefenamic Acid 500mg SOS for pain"]
}
```

---

### Obstetric

Specialty panel for obstetric patients. Contains:

**Obstetric Formula:** Standard GPAL notation (e.g. `G3P2A0L2`)

**Previous Pregnancies:**
```json
{
  "id": "preg-1",
  "year": "2020",
  "outcome": "Live Birth",
  "modeOfDelivery": "NVD",
  "birthWeight": "3.2 kg",
  "gender": "Male",
  "complications": []
}
```
Delivery modes: NVD (Normal Vaginal Delivery), LSCS (Lower Segment Caesarean Section), Forceps, Vacuum
Outcomes: Live Birth, Stillbirth, Abortion (spontaneous/induced)

**Current Pregnancy (Antenatal Visits):**
```json
{
  "edd": "2025-09-15",
  "lmp": "2024-12-08",
  "gestationalAge": "28 weeks",
  "gravida": 3,
  "para": 2,
  "abortion": 0,
  "living": 2,
  "antenatalVisits": [
    {
      "id": "an-1",
      "date": "2025-06-20",
      "gestationalAge": "28 weeks",
      "weight": 68,
      "bp": "118/76",
      "fetalHeartRate": 142,
      "presentation": "Cephalic",
      "uterineHeight": "28 cm",
      "notes": "All normal, GCT — Normal"
    }
  ]
}
```

---

### Vaccine

Organised by vaccine category (COVID-19, Influenza, Hepatitis, etc.). Each dose record:

```json
{
  "id": "vac-1",
  "vaccineName": "Covishield",
  "dose": "Dose 1",
  "dateAdministered": "2021-05-15",
  "status": "Completed",
  "batchNumber": "4121Z025",
  "site": "Left Deltoid"
}
```

**Status values:** `Completed` / `Due` / `Overdue` / `Scheduled` / `Missed`

**Colour coding:**
- `Completed` → green
- `Due` → blue
- `Overdue` → red
- `Scheduled` → violet
- `Missed` → muted slate + strikethrough

---

### Growth

Longitudinal weight/height/BMI tracking. Each entry:

```json
{
  "id": "gr-1",
  "date": "2025-06-24",
  "age": "34 years",
  "weight": 72,
  "height": 175,
  "bmi": 23.5,
  "notes": "BMI in normal range"
}
```

Multiple entries are plotted as a trend. For paediatric patients this includes percentile charts. For adult patients it is a simple time-series table.

---

### Lab Results

Organised by test category (Hematology, Biochemistry, Thyroid, etc.). Each report:

```json
{
  "id": "lab-1",
  "date": "2025-06-20",
  "labName": "PathCare Diagnostics",
  "orderedBy": "Dr. Ananya Sharma",
  "category": "Hematology",
  "tests": [
    {
      "id": "lt-1",
      "testName": "Hemoglobin",
      "value": "14.2",
      "unit": "g/dL",
      "referenceRange": "13.0–17.0",
      "status": "Normal"
    },
    {
      "id": "lt-2",
      "testName": "WBC Count",
      "value": "11,200",
      "unit": "/μL",
      "referenceRange": "4,000–11,000",
      "status": "Abnormal",
      "flag": "High"
    }
  ]
}
```

**Status values:** `Normal` / `Abnormal` / `Critical` / `Pending`

**Colour coding:**
- `Normal` → default slate text
- `Abnormal` → amber bold (`tp-warning-600 font-semibold`)
- `Critical` → red bold (`tp-error-600 font-bold`) — highest visual priority
- `Pending` → muted italic (`tp-slate-400 italic`)

Common test categories: Hematology (CBC, ESR), Biochemistry (sugar, HbA1c, creatinine, liver enzymes, cholesterol), Thyroid (TSH, T3, T4), Urine, Hormones, Culture & Sensitivity.

---

### Medical Records (Documents)

Uploaded patient documents. Each record:

```json
{
  "id": "doc-1",
  "title": "Blood Test Report — June 2025",
  "type": "Lab Report",
  "date": "2025-06-20",
  "uploadedBy": "Dr. Ananya Sharma",
  "fileUrl": "https://...",
  "fileType": "pdf",
  "fileSize": "1.2 MB",
  "tags": ["Hematology", "Biochemistry"],
  "notes": "PA view — No significant abnormality"
}
```

**Document types:** Lab Report, Prescription, Radiology, Discharge Summary, Referral Letter, Insurance Document, Other

**File types:** `pdf` / `image` (JPG, PNG) / `dicom`

---

### Follow-up (Sidebar — historical)

Past and upcoming follow-up appointments for the patient:

```json
{
  "id": "fu-1",
  "scheduledDate": "2025-06-29",
  "reason": "Review after antibiotics course",
  "doctorName": "Dr. Ananya Sharma",
  "status": "Scheduled",
  "visitType": "OPD",
  "notes": "Check throat, review symptoms",
  "reminderSent": true
}
```

**Status values:** `Scheduled` / `Completed` / `Missed` / `Cancelled` / `Rescheduled`

**Colour coding:**
- `Scheduled` → blue
- `Completed` → green
- `Missed` → red
- `Cancelled` → muted slate
- `Rescheduled` → amber

---

## AI Integration Points

The RxPad is deeply integrated with the **Dr. Agent AI assistant** and **VoiceRx** voice-to-EMR system. Here is a summary of all AI touchpoints:

| Trigger | Section | What happens |
|---|---|---|
| VoiceRx dictation | Any module | Speech is transcribed and parsed; rows are auto-populated in the relevant section |
| "Suggest DDX" chip | Symptoms → Diagnosis | Dr. Agent generates differential diagnoses based on entered symptoms |
| "Suggest lab tests" chip | Diagnosis → Lab | Dr. Agent suggests investigations matching the diagnosis |
| "Check interactions" chip | Medication | Dr. Agent checks and explains drug-drug interactions |
| "Translate advice" chip | Advices | Dr. Agent translates advice text to patient's language |
| "Suggest investigations" chip | Lab | Re-trigger from Lab section itself |
| Drug-allergy cross-check | Medication | Real-time: each added drug is checked against allergy history |
| DDI inline tag | Medication dropdown | Each drug option shows interaction risk against existing medications |
| DDx % match tag | Diagnosis dropdown | Each diagnosis option shows AI relevance % from current symptom set |
| Investigation match tag | Lab dropdown | Each test shows % relevance to current diagnosis list |
| Ungrounded row indicator | Medication, Lab | AI-added rows are visually flagged until the doctor confirms them |

---

## Data Persistence

- All RxPad table rows are kept in **React local state** during a consultation session.
- Custom module rows are persisted to **localStorage** under key `rxpad:custom:<moduleId>:<patientId>` so they survive page refreshes within the same session.
- The complete RxPad snapshot (all section rows, notes, follow-up date) is assembled and sent to the backend on "End Visit" / "Save Rx".
- The snapshot shape includes: `symptoms`, `examinations`, `diagnoses`, `medications`, `advice`, `labInvestigations`, `surgeries`, `additionalNotes`, `followUp`, `followUpDate`, `customModules`.

---

## Key Design Rules (for any new section or AI output)

1. **Every row must have a unique `id`** generated as `<sectionKey>_<timestamp>_<3-char-random>`.
2. **Primary key column** (name/medicine/advice/investigation/surgery) drives the autocomplete search, drag-order, and copy behavior.
3. **`restrictToOptions: true`** means the user can only pick from the provided list (frequency, status, when, severity). **`false`** means free entry plus suggestions.
4. **VoiceRx output** always lands as an array of strings. The RxPad parses each string and maps it to the correct row shape for that section.
5. **Dr. Agent output** arrives via the `rxpad-sync-context` data bus as a typed payload object with named arrays per section — not raw strings.
6. **Allergy alerts and DDI warnings are always surfaced inline** — never silently swallowed.
