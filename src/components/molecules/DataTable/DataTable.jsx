"use client";

/**
 * DataTable — shared molecule for the patient-listing tables across
 * Appointments, Follow-ups, and All Patients. Encodes the agreed
 * convention so every list reads as the same surface:
 *
 *   – Header row: bg-tp-slate-100, 12px uppercase semibold, rounded
 *     left+right caps via the first/last column.
 *   – Body row: 64px tall, hover bg-tp-slate-50/50, border-b
 *     hairline (last:border-b-0).
 *   – Sticky right column (Action) with a rounded top-right cap.
 *   – Empty state slot (icon + message + optional reset CTA).
 *
 * Each column is a defined object:
 *   {
 *     id: "name",                  // unique key
 *     header: "Name" | <Sortable />, // header content (string or node)
 *     width?: "48px",              // explicit pixel width
 *     minWidth?: "160px",          // min-width for content cells
 *     sticky?: "right",            // makes the column sticky right
 *     headerClassName?: string,
 *     cellClassName?: string,
 *     cell: (row, index) => ReactNode,
 *   }
 *
 * Used by `app/tp-appointment-screen/DrAgentPage`,
 * `app/follow-ups/FollowUpsPage`, `app/all-patients/AllPatientsPage`.
 */

import * as React from "react";
import { cn } from "@/src/hooks/utils";

const HEADER_BASE =
  "px-3 py-3 text-left text-[12px] font-semibold uppercase text-tp-slate-700";
const ROW_BASE = "h-16 border-b border-tp-slate-100 last:border-b-0 hover:bg-tp-slate-50/50";

export function DataTable({
  columns,
  data,
  rowKey = (row, i) => row?.id ?? i,
  emptyState = null,
  rowClassName,
  className,
}) {
  // Decorate the first/last column with rounded caps so the header bar
  // rounds correctly regardless of caller-passed widths.
  const last = columns.length - 1;
  return (
    <table className={cn("w-full border-collapse", className)}>
      <thead>
        <tr className="rounded-[12px] bg-tp-slate-100">
          {columns.map((col, i) => {
            const sticky = col.sticky === "right";
            const cls = cn(
              HEADER_BASE,
              i === 0 && "rounded-l-[12px]",
              i === last && "rounded-tr-[12px] rounded-br-[12px]",
              sticky && "sticky right-0 z-20 w-[1%] whitespace-nowrap pl-3 pr-2 bg-tp-slate-100",
              col.headerClassName,
            );
            return (
              <th
                key={col.id}
                className={cls}
                style={{
                  width: col.width,
                  minWidth: col.minWidth,
                }}>
                {col.header}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && emptyState ? (
          <tr>
            <td colSpan={columns.length} className="py-12 text-center">
              {emptyState}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={cn(
                ROW_BASE,
                typeof rowClassName === "function" ? rowClassName(row, i) : rowClassName,
              )}>
              {columns.map((col) => {
                const sticky = col.sticky === "right";
                return (
                  <td
                    key={col.id}
                    className={cn(
                      "px-3 py-3 align-middle",
                      sticky && "sticky right-0 z-10 bg-white pl-3 pr-2",
                      col.cellClassName,
                    )}
                    style={{ width: col.width }}>
                    {col.cell(row, i)}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

DataTable.displayName = "DataTable";
