import React from "react";
import { fmt } from "./calculations.js";

// Safe number — never NaN
export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Safe percentage — never NaN, returns number (not string)
export function safePercent(value, total) {
  const v = safeNum(value);
  const t = safeNum(total);
  if (!t) return 0;
  const p = (v / t) * 100;
  return Number.isFinite(p) ? p : 0;
}

// Sum of a numeric key across a data array (used as the "total" base for %)
export function sumOf(data, key) {
  if (!Array.isArray(data)) return 0;
  return data.reduce((s, row) => s + safeNum(row && row[key]), 0);
}

/**
 * LabelList content renderer for Bar charts.
 * Shows "Value (Percent%)" above every bar. Never shows NaN.
 * Usage: <Bar dataKey="tonnage"><LabelList content={renderBarTopLabel(total)} /></Bar>
 */
export function renderBarTopLabel(total) {
  return function BarTopLabel(props) {
    const { x, y, width, value } = props;
    const v = safeNum(value);
    const pct = safePercent(v, total);
    const cx = safeNum(x) + safeNum(width) / 2;
    const cy = safeNum(y) - 8;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#1f2937"
      >
        {`${fmt(v, 0)} (${pct.toFixed(1)}%)`}
      </text>
    );
  };
}

/**
 * LabelList content renderer for horizontal Bar charts (layout="vertical").
 * Places "Value (Percent%)" just to the right of each bar.
 */
export function renderBarRightLabel(total) {
  return function BarRightLabel(props) {
    const { x, y, width, height, value } = props;
    const v = safeNum(value);
    const pct = safePercent(v, total);
    const tx = safeNum(x) + safeNum(width) + 6;
    const ty = safeNum(y) + safeNum(height) / 2 + 4;
    return (
      <text x={tx} y={ty} textAnchor="start" fontSize={11} fontWeight={600} fill="#1f2937">
        {`${fmt(v, 0)} (${pct.toFixed(1)}%)`}
      </text>
    );
  };
}

/**
 * Shows: Category / Value / Percentage for each series in the payload.
 * `total` may be a single number (shared across all series) or a function
 * (seriesName) => number, for charts with multiple bars of different totals.
 */
export function BarChartTooltip({ active, payload, label, total, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5eaf1",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
        fontSize: 13,
        lineHeight: 1.5
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#1f2937" }}>
        Category: {label ?? "N/A"}
      </div>
      {payload.map((p, i) => {
        const v = safeNum(p.value);
        const seriesTotal =
          typeof total === "function" ? safeNum(total(p.dataKey || p.name)) : safeNum(total);
        const pct = safePercent(v, seriesTotal);
        return (
          <div key={i} style={{ color: p.color || p.fill || "#1f2937" }}>
            {payload.length > 1 ? `${p.name}: ` : "Value: "}
            {fmt(v, 0)}
            {unit ? ` ${unit}` : ""}
            {" — "}Percentage: {pct.toFixed(1)}%
          </div>
        );
      })}
    </div>
  );
}

/**
 * Custom tooltip for Pie charts.
 * Shows only: Category / Value / Percentage. Nothing else.
 * Expects each pie data item to optionally already carry a `total`,
 * otherwise pass `total` explicitly (sum of the dataKey across the pie data).
 */
export function PieChartTooltip({ active, payload, total, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const v = safeNum(p.value);
  const pct = safePercent(v, total);
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5eaf1",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
        fontSize: 13,
        lineHeight: 1.5
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#1f2937" }}>
        {p.name ?? p.payload?.name ?? "N/A"}
      </div>
      <div>
        Value: {fmt(v, 0)}
        {unit ? ` ${unit}` : ""}
      </div>
      <div>Percentage: {pct.toFixed(1)}%</div>
    </div>
  );
}

// Fixed thickness ranges (mm) — always shown even when count is 0
export const THICKNESS_RANGES = [
  { name: "<2", min: -Infinity, max: 2 },
  { name: "2-4", min: 2, max: 4 },
  { name: "4-6", min: 4, max: 6 },
  { name: "6-8", min: 6, max: 8 },
  { name: "8-10", min: 8, max: 10 },
  { name: "10-12", min: 10, max: 12 },
  { name: "12-14", min: 12, max: 14 },
  { name: "14-16", min: 14, max: 16 },
  { name: "16-18", min: 16, max: 18 },
  { name: "18-20", min: 18, max: 20 },
  { name: "20", min: 20, max: Infinity }
];

// Fixed width ranges (mm) — always shown even when count is 0
export const WIDTH_RANGES = [
  { name: "<900", min: -Infinity, max: 900 },
  { name: "900-1000", min: 900, max: 1000 },
  { name: "1000-1100", min: 1000, max: 1100 },
  { name: "1100-1200", min: 1100, max: 1200 },
  { name: "1200-1300", min: 1200, max: 1300 },
  { name: "1300-1400", min: 1300, max: 1400 },
  { name: "1400-1500", min: 1400, max: 1500 },
  { name: "1500-1600", min: 1500, max: 1600 },
  { name: "1600-1700", min: 1600, max: 1700 },
  { name: "1700", min: 1700, max: Infinity }
];

// Build fixed-range histogram data from raw rows + a numeric field accessor.
export function buildFixedRangeHistogram(data, getValue, ranges) {
  const buckets = ranges.map((r) => ({ name: r.name, value: 0 }));
  (data || []).forEach((row) => {
    const v = safeNum(getValue(row));
    if (!v) return;
    const idx = ranges.findIndex((r) => v >= r.min && v < r.max);
    const finalIdx = idx === -1 ? ranges.length - 1 : idx;
    buckets[finalIdx].value += 1;
  });
  return buckets;
}
