/**
 * Obstetric History content panel — structured cards with inline VoiceRx highlights.
 */
import React, { useState } from "react";

import { ActionButton, SectionCard, SectionScrollArea } from "../detail-shared";
import { AiTriggerIcon } from "../../dr-agent/shared/AiTriggerIcon";
import {
  HistoricalInlineTooltip,
  historicalInlineHighlightClass,
  historicalInlineTextClass,
  isHistoricalMetaLine,
  useHistoricalSectionHighlights,
} from "../HistoricalInlineUpdates";

type ObstetricLine = {
  text: string;
  isHighlighted?: boolean;
  isFresh?: boolean;
};

type ObstetricSection = {
  id: string;
  title: string;
  collapsible?: boolean;
  lines: ObstetricLine[];
};

const BASE_SECTIONS: ObstetricSection[] = [
  {
    id: "patientInfo",
    title: "Patient Info",
    lines: [
      { text: "LMP: 14 Jan'26 | EDD: 21 Oct'26 | C.E.D.D: 25 Oct'26" },
      { text: "Gestation: 14 Weeks 2 Days | Patient Blood Group: B+ve | Husband's Blood Group: O+ve" },
      { text: "Marital Status: Married | Marriage Duration: 3 Years 6 Months | Consanguineous: No" },
    ],
  },
  {
    id: "gplae",
    title: "GPLAE",
    lines: [
      { text: "G: 1 | P: 0 | L: 0 | A: 0 | E: 0" },
      { text: "Primigravida" },
    ],
  },
  {
    id: "pregnancy",
    title: "Pregnancy History",
    collapsible: true,
    lines: [
      { text: "Gravida no: 1 | Mode of Delivery: LSCS | Date of Delivery: 14 Nov'24 | Gender: Male | Baby's Weight: 3.2 Kgs" },
      { text: "Gravida no: 2 | Mode of Delivery: NVD | Date of Delivery: 22 Mar'22 | Gender: Female | Baby's Weight: 2.8 Kgs | Remarks: Uneventful delivery" },
    ],
  },
  {
    id: "examination",
    title: "Current Examination",
    collapsible: true,
    lines: [
      { text: "17 Jan'26 | Pallor: Absent | Oedema: Mild | BMI: 23 Kg/m² | BP: 128/82 mmHg | Fundus Height: 14 cm | Presentation: Cephalic | Liquor: Adequate | FHR: 142 bpm" },
      { text: "24 Jan'26 | Pallor: Absent | Oedema: Absent | BMI: 23.2 Kg/m² | BP: 122/80 mmHg | Fundus Height: 16 cm | Presentation: Cephalic | Liquor: Adequate | FHR: 138 bpm" },
    ],
  },
  {
    id: "anc",
    title: "ANC Scheduler",
    collapsible: true,
    lines: [
      { text: "Complete Blood Count | Week Range: 8-12 Weeks | Due Date: 11 Mar'26 | Status: Done | Remarks: All values within normal limits" },
      { text: "Glucose Tolerance Test | Week Range: 24-28 Weeks | Due Date: 08 Jul'26 | Status: Due" },
    ],
  },
  {
    id: "immunisation",
    title: "Immunisation History",
    collapsible: true,
    lines: [
      { text: "Tetanus Toxoid (TT-1) | Status: Done | Given Date: 20 Feb'26 | Remarks: No adverse reaction" },
      { text: "Tetanus Toxoid (TT-2) | Status: Due | Remarks: Scheduled for next visit" },
    ],
  },
];

function pickObstetricSection(text: string) {
  const lower = text.toLowerCase();
  if (/(lmp|edd|blood group|marital|consanguineous|gestation)/i.test(lower)) return "patientInfo";
  if (/\bg:\s|\bp:\s|\bl:\s|\ba:\s|\be:\s|primigravida/i.test(lower)) return "gplae";
  if (/(gravida|delivery|baby|pregnancy history)/i.test(lower)) return "pregnancy";
  if (/(bp|oedema|pallor|fundus|presentation|liquor|fhr|examination)/i.test(lower)) return "examination";
  if (/(anc|week range|due date|scheduler|glucose tolerance|cbc)/i.test(lower)) return "anc";
  if (/(tt-|tetanus|immunisation|vaccine)/i.test(lower)) return "immunisation";
  return "examination";
}

function buildObstetricSections(lines: Array<{ text: string; isFresh: boolean }>) {
  const next = BASE_SECTIONS.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({ ...line })),
  }));

  lines.forEach((line) => {
    const text = line.text.trim();
    if (!text || isHistoricalMetaLine(text)) return;
    const section = next.find((entry) => entry.id === pickObstetricSection(text));
    if (!section) return;
    section.lines.push({
      text,
      isHighlighted: true,
      isFresh: line.isFresh,
    });
  });

  return next;
}

/** Same parser as Gynec — keeps Label muted + value dark. */
function parseLabelledSegments(text: string): Array<{ label?: string; value: string }> {
  return text
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const idx = seg.indexOf(":");
      if (idx === -1) return { value: seg };
      return { label: seg.slice(0, idx).trim(), value: seg.slice(idx + 1).trim() };
    });
}

function ObstetricLineRow({
  line,
  showTooltip,
}: {
  line: ObstetricLine;
  showTooltip: boolean;
}) {
  const segments = parseLabelledSegments(line.text);
  const row = (
    <div className={historicalInlineHighlightClass(line.isHighlighted, line.isFresh)}>
      <p className="whitespace-pre-wrap text-[14px] leading-[20px] text-tp-slate-700">
        <span className={historicalInlineTextClass(line.isHighlighted, line.isFresh)}>
          {segments.map((seg, i) => (
            <span key={i}>
              {i > 0 ? <span className="text-tp-slate-500"> | </span> : null}
              {seg.label ? (
                <>
                  <span className="text-tp-slate-500">{seg.label}: </span>
                  <span className="font-medium text-tp-slate-700">{seg.value}</span>
                </>
              ) : (
                <span className="text-tp-slate-700">{seg.value}</span>
              )}
            </span>
          ))}
        </span>
      </p>
    </div>
  );

  return (
    <HistoricalInlineTooltip enabled={showTooltip}>
      {row}
    </HistoricalInlineTooltip>
  );
}

export function ObstetricHistoryContent() {
  const { lines, showTooltipOnFirstOpen } = useHistoricalSectionHighlights("obstetric");
  const sections = buildObstetricSections(lines);
  const firstTooltipSectionId = sections.find((section) => section.lines.some((line) => line.isHighlighted))?.id;
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({
    pregnancy: true,
    examination: true,
    anc: true,
    immunisation: true,
  });

  return (
    <div className="content-stretch flex flex-col items-center relative size-full">
      <ActionButton label="Add/Edit Details" icon="plus" sectionId="obstetric" />
      <SectionScrollArea>
        {sections.map((section) => {
          const expanded = !section.collapsible || expandedState[section.id] !== false;
          const firstHighlightedIndex = section.lines.findIndex((line) => line.isHighlighted);
          return (
            <SectionCard
              key={section.id}
              title={section.title}
              expanded={expanded}
              hideChevron={!section.collapsible}
              onToggle={
                section.collapsible
                  ? () => setExpandedState((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                  : undefined
              }
              titleAddon={
                <AiTriggerIcon
                  tooltip={`Summarize ${section.title.toLowerCase()}`}
                  signalLabel={`Summarize ${section.title.toLowerCase()}`}
                  sectionId="obstetric"
                  size={12}
                  as="span"
                />
              }
            >
              <div className="bg-white px-[12px] py-[10px] flex flex-col gap-[6px] w-full">
                {section.lines.map((line, index) => (
                  <ObstetricLineRow
                    key={`${section.id}-${index}`}
                    line={line}
                    showTooltip={Boolean(line.isHighlighted && line.isFresh && showTooltipOnFirstOpen && section.id === firstTooltipSectionId && index === firstHighlightedIndex)}
                  />
                ))}
              </div>
            </SectionCard>
          );
        })}
      </SectionScrollArea>
    </div>
  );
}
