import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Download, Printer, Search, RefreshCcw, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import { fmt, percent } from "../utils/calculations.js";

const columns = [
  ["production_date", "Production Date"],
  ["coil_id", "Coil ID"],
  ["steel_grade_code", "Grade Code"],
  ["steel_grade_family", "SGF"],
  ["slab_type", "Slab Type"],
  ["thickness", "Thickness"],
  ["width", "Width"],
  ["furnace", "Furnace"],
  ["shift", "Shift"],
  ["weight", "Weight MT"],
  ["yield_percent", "Yield %"],
  ["status", "Status"],
  ["delay_minutes", "Delay Min"],
  ["defect_type", "Defect Type"]
];

function formatCell(row, key) {
  if (key === "production_date") return new Date(row[key]).toLocaleDateString("en-GB");
  if (["weight", "yield_percent"].includes(key)) return Number(row[key] || 0).toFixed(2);
  return row[key] ?? "";
}

function exportCSV(rows) {
  const csv = [
    columns.map(([, label]) => label).join(","),
    ...rows.map((row) => columns.map(([key]) => `"${String(formatCell(row, key)).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "jspl_hsm_report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows) {
  const sheetRows = rows.map((row) => Object.fromEntries(columns.map(([key, label]) => [label, formatCell(row, key)])));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HSM Report");
  XLSX.writeFile(wb, "jspl_hsm_report.xlsx");
}

export default function ReportsDownloads({ data, fileName }) {
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("All");
  const [status, setStatus] = useState("All");
  const [reportType, setReportType] = useState("Production Summary");
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filtered = useMemo(() => data.filter((row) => {
    const q = search.toLowerCase();
    const searchOk = !q || [row.coil_id, row.steel_grade_code, row.steel_grade_family, row.slab_type, row.furnace, row.customer_name].some((v) => String(v || "").toLowerCase().includes(q));
    const shiftOk = shift === "All" || row.shift === shift;
    const statusOk = status === "All" || String(row.status).toUpperCase() === status;
    return searchOk && shiftOk && statusOk;
  }), [data, search, shift, status]);

  const totalTonnage = filtered.reduce((s, r) => s + Number(r.weight || 0), 0);
  const avgYield = filtered.length ? filtered.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / filtered.length : 0;
  const rejects = filtered.filter((r) => String(r.status).toUpperCase() === "FAIL").length;
  const totalDelay = filtered.reduce((s, r) => s + Number(r.delay_minutes || 0), 0);
  const previewRows = filtered.slice(0, rowsPerPage);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={FileSpreadsheet} title="Report Records" value={fmt(filtered.length)} unit="" target="Filtered Report" color="#0b63ce" progress={95} change="Rows" />
        <MetricCard icon={BarChart3} title="Tonnage" value={fmt(totalTonnage, 0)} unit="MT" target="Report Tonnage" color="#ff5a00" progress={88} change="MT" />
        <MetricCard icon={RefreshCcw} title="Avg Yield" value={avgYield.toFixed(2)} unit="%" target="Report Yield" color="#16a34a" progress={85} change="Avg" />
        <MetricCard icon={Search} title="Rejects" value={fmt(rejects)} unit="" target={`${percent(rejects, filtered.length)}% of Report`} color="#ef4444" progress={45} change="Reject" negative />
        <MetricCard icon={Printer} title="Delay" value={fmt(totalDelay, 0)} unit="min" target="Total Delay" color="#7c3aed" progress={60} change="Min" />
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option>Production Summary</option>
            <option>Quality Report</option>
            <option>Delay Report</option>
            <option>Furnace Report</option>
            <option>Full Production Data</option>
          </select>
          <div className="search-input"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search report data..." /></div>
          <select value={shift} onChange={(e) => setShift(e.target.value)}><option>All</option><option>A</option><option>B</option><option>C</option></select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>PASS</option><option>FAIL</option></select>
          <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}><option value={25}>25 preview rows</option><option value={50}>50 preview rows</option><option value={100}>100 preview rows</option></select>
        </div>
        <div className="toolbar-right">
          <button className="secondary-btn" onClick={() => { setSearch(""); setShift("All"); setStatus("All"); }}><RefreshCcw size={15}/> Reset</button>
          <button className="primary-btn" onClick={() => exportExcel(filtered)}><Download size={15}/> Excel</button>
          <button className="primary-btn" onClick={() => exportCSV(filtered)}><Download size={15}/> CSV</button>
          <button className="secondary-btn" onClick={() => window.print()}><Printer size={15}/> Print / PDF</button>
        </div>
      </section>

      <section className="card page-title report-summary">
        <h2>{reportType}</h2>
        <p>Source: {fileName || "Uploaded File"} | Records: {fmt(filtered.length)} | Tonnage: {fmt(totalTonnage, 0)} MT | Avg Yield: {avgYield.toFixed(2)}%</p>
      </section>

      <div className="table-card">
        <table>
          <thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{previewRows.map((row, i) => <tr key={i}>{columns.map(([key]) => <td key={key}>{key === "status" ? <span className={String(row.status).toUpperCase() === "FAIL" ? "status-badge fail" : "status-badge pass"}>{row.status}</span> : formatCell(row, key)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
