import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from "recharts";
import { ShieldCheck, XCircle, CheckCircle, Search, Download } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, renderBarRightLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

function count(rows, key) {
  const map = {};
  rows.forEach((row) => {
    const name = row[key] || "Unknown";
    map[name] = (map[name] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function exportCsv(rows) {
  const headers = ["date", "coil_id", "grade", "sgf", "yield_percent", "status", "defect_type"];
  const text = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "",
        row.coil_id,
        row.steel_grade_code,
        row.steel_grade_family,
        row.yield_percent,
        row.status,
        row.defect_type || ""
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");

  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "quality_information.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function QualityInformation({ data }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) => {
      if (!q) return true;
      return [row.coil_id, row.steel_grade_code, row.steel_grade_family, row.status, row.defect_type].some((value) =>
        String(value || "").toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const tableRows = useMemo(() => {
    return rows.filter((row) => showAll || String(row.status).toUpperCase() === "FAIL");
  }, [rows, showAll]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / rowsPerPage));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return tableRows.slice(start, start + rowsPerPage);
  }, [tableRows, page]);

  const metrics = useMemo(() => {
    const rejects = rows.filter((row) => String(row.status).toUpperCase() === "FAIL").length;
    const pass = rows.length - rejects;
    const avgYield = rows.length ? rows.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / rows.length : 0;
    return { rejects, pass, avgYield };
  }, [rows]);

  const defectData = useMemo(
    () => count(rows.filter((row) => String(row.status).toUpperCase() === "FAIL"), "defect_type"),
    [rows]
  );

  const statusData = useMemo(
    () => [
      { name: "PASS", value: metrics.pass },
      { name: "FAIL", value: metrics.rejects }
    ],
    [metrics]
  );

  const gradeDefects = useMemo(
    () => count(rows.filter((row) => String(row.status).toUpperCase() === "FAIL"), "steel_grade_code").slice(0, 10),
    [rows]
  );

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={ShieldCheck} title="Quality Records" value={fmt(rows.length)} unit="" target="Current View" color="#0b63ce" progress={95} change="Live" />
        <MetricCard icon={CheckCircle} title="Passed" value={fmt(metrics.pass)} unit="" target="Accepted" color="#16a34a" progress={88} change="OK" />
        <MetricCard icon={XCircle} title="Rejected" value={fmt(metrics.rejects)} unit="" target={`${percent(metrics.rejects, rows.length)}% of Total`} color="#ef4444" progress={45} change="Monitor" negative />
        <MetricCard icon={ShieldCheck} title="Avg Yield" value={metrics.avgYield.toFixed(2)} unit="%" target="Quality Factor" color="#ff5a00" progress={90} change="Avg" />
        <MetricCard icon={Search} title="Defect Types" value={defectData.length} unit="" target="Unique Defects" color="#7c3aed" progress={60} change="Types" />
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={18} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search quality records..." />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="secondary-btn" onClick={() => { setShowAll(!showAll); setPage(1); }}>{showAll ? "Show Rejects Only" : "Show All"}</button>
          <button className="primary-btn" onClick={() => exportCsv(rows)}><Download size={15} /> Export CSV</button>
        </div>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="PASS / FAIL COUNT" isEmpty={statusData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(statusData, "value")} />} />
              <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" content={renderBarTopLabel(sumOf(statusData, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="DEFECT TYPE COUNT" isEmpty={defectData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={defectData} layout="vertical" margin={{ right: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip content={<BarChartTooltip total={sumOf(defectData, "value")} />} />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="value" content={renderBarRightLabel(sumOf(defectData, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GRADE-WISE DEFECTS" isEmpty={gradeDefects.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeDefects} layout="vertical" margin={{ right: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={90} />
              <Tooltip content={<BarChartTooltip total={sumOf(gradeDefects, "value")} />} />
              <Bar dataKey="value" fill="#ff5a00" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="value" content={renderBarRightLabel(sumOf(gradeDefects, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>Date</th><th>Coil ID</th><th>Grade</th><th>SGF</th><th>Yield %</th><th>Status</th><th>Defect Type</th></tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${row.coil_id || "row"}-${index}`}>
                <td>{row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "-"}</td>
                <td>{row.coil_id || "-"}</td>
                <td>{row.steel_grade_code || "-"}</td>
                <td>{row.steel_grade_family || "-"}</td>
                <td>{Number(row.yield_percent || 0).toFixed(2)}</td>
                <td><span className={String(row.status).toUpperCase() === "FAIL" ? "status-badge fail" : "status-badge pass"}>{row.status || "PASS"}</span></td>
                <td>{row.defect_type || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-card">
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <span>Page {page} of {totalPages} | Showing {visibleRows.length} of {tableRows.length} records</span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </>
  );
}
