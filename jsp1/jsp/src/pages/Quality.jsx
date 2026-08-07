import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from "recharts";
import { ShieldCheck, XCircle, Gauge, CheckCircle, AlertTriangle } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, renderBarRightLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function groupByDate(data) {
  const map = {};

  data.forEach((row) => {
    const d = new Date(row.production_date);
    if (Number.isNaN(d.getTime())) return;

    const cleanDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const key = localDateKey(cleanDate);

    if (!map[key]) {
      map[key] = {
        dateObj: cleanDate,
        date: cleanDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        yield: 0,
        rejects: 0,
        total: 0
      };
    }

    map[key].yield += Number(row.yield_percent || 0);
    map[key].rejects += String(row.status).toUpperCase() === "FAIL" ? 1 : 0;
    map[key].total += 1;
  });

  return Object.values(map)
    .map((x) => ({
      dateObj: x.dateObj,
      date: x.date,
      yield: x.total ? Number((x.yield / x.total).toFixed(2)) : 0,
      rejects: x.rejects
    }))
    .sort((a, b) => a.dateObj - b.dateObj);
}


function countBy(data, key) {
  const map = {};

  data.forEach((row) => {
    const name = row[key] || "Unknown";
    map[name] = (map[name] || 0) + 1;
  });

  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

export default function Quality({ data }) {
  const [showTable, setShowTable] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const metrics = useMemo(() => {
    const total = data.length;
    const rejects = data.filter((r) => String(r.status).toUpperCase() === "FAIL").length;
    const passed = total - rejects;
    const avgYield = total ? data.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / total : 0;
    return { total, rejects, passed, avgYield };
  }, [data]);

  const defectData = useMemo(
    () => countBy(data.filter((r) => String(r.status).toUpperCase() === "FAIL"), "defect_type"),
    [data]
  );

  const daily = useMemo(() => groupByDate(data), [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page]);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={Gauge} title="Avg. Yield (%)" value={metrics.avgYield.toFixed(2)} unit="%" target="Target: 97.50%" color="#16a34a" progress={92} change="+0.62%" />
        <MetricCard icon={XCircle} title="Total Rejects" value={fmt(metrics.rejects)} unit="" target={`${percent(metrics.rejects, metrics.total)}% of Total`} color="#7c3aed" progress={45} change="-4.3%" negative />
        <MetricCard icon={CheckCircle} title="Passed Coils" value={fmt(metrics.passed)} unit="" target="Accepted Production" color="#0b63ce" progress={90} change="OK" />
        <MetricCard icon={ShieldCheck} title="Quality Score" value={(100 - Number(percent(metrics.rejects, metrics.total))).toFixed(2)} unit="%" target="Calculated Score" color="#ff5a00" progress={88} change="Live" />
        <MetricCard icon={AlertTriangle} title="Defect Types" value={defectData.length} unit="" target="Unique Defects" color="#ef4444" progress={60} change="Monitor" negative />
      </section>

      <section className="chart-grid-three">
        <ChartCard title="YIELD TREND (%)" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis domain={[90, 100]} />
              <Tooltip />
              <Line dataKey="yield" stroke="#16a34a" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="REJECT TREND" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(daily, "rejects")} />} />
              <Bar dataKey="rejects" fill="#7c3aed" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="rejects" content={renderBarTopLabel(sumOf(daily, "rejects"))} />
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
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <strong>Quality Inspection Records</strong>
          <span style={{ color: "#64748b", fontSize: 13 }}>Full records: {data.length}</span>
        </div>
        <div className="toolbar-right">
          <button className="primary-btn" onClick={() => setShowTable(!showTable)}>
            {showTable ? "Hide Table" : "Show Full Table"}
          </button>
        </div>
      </section>

      {showTable && (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Coil ID</th>
                  <th>Date</th>
                  <th>Grade</th>
                  <th>SGF</th>
                  <th>Yield %</th>
                  <th>Status</th>
                  <th>Defect Type</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={`${row.coil_id || "row"}-${i}`}>
                    <td>{row.coil_id || "-"}</td>
                    <td>{row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "-"}</td>
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
            <span>Page {page} of {totalPages} | Showing {visibleRows.length} of {data.length} records</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </>
      )}
    </>
  );
}
