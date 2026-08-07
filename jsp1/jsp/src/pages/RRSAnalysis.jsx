import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  LabelList
} from "recharts";
import { BarChart3, Package, Gauge, XCircle, Activity } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function groupDaily(data) {
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
        rolled: 0,
        rejected: 0,
        tonnage: 0
      };
    }

    map[key].rolled += 1;
    map[key].tonnage += Number(row.weight || 0);
    if (String(row.status).toUpperCase() === "FAIL") map[key].rejected += 1;
  });

  return Object.values(map)
    .map((x) => ({ ...x, tonnage: Number(x.tonnage.toFixed(0)) }))
    .sort((a, b) => a.dateObj - b.dateObj);
}


function groupStatus(data) {
  const pass = data.filter((row) => String(row.status).toUpperCase() !== "FAIL").length;
  const fail = data.length - pass;
  return [
    { name: "Rolled / Accepted", value: pass },
    { name: "Rejected", value: fail }
  ];
}

function groupFurnace(data) {
  const map = {};

  data.forEach((row) => {
    const name = row.furnace || "Unknown";
    if (!map[name]) map[name] = { name, rolled: 0, rejected: 0 };
    map[name].rolled += 1;
    if (String(row.status).toUpperCase() === "FAIL") map[name].rejected += 1;
  });

  return Object.values(map);
}

export default function RRSAnalysis({ data }) {
  const [showTable, setShowTable] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const metrics = useMemo(() => {
    const rejected = data.filter((row) => String(row.status).toUpperCase() === "FAIL").length;
    const rolled = data.length - rejected;
    const tonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
    const yieldAvg = data.length ? data.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / data.length : 0;
    return { rejected, rolled, tonnage, yieldAvg };
  }, [data]);

  const daily = useMemo(() => groupDaily(data), [data]);
  const statusData = useMemo(() => groupStatus(data), [data]);
  const furnaceData = useMemo(() => groupFurnace(data), [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page]);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={Package} title="Rolled Coils" value={fmt(metrics.rolled)} unit="" target="Accepted" color="#16a34a" progress={90} change="Rolled" />
        <MetricCard icon={XCircle} title="Rejected Coils" value={fmt(metrics.rejected)} unit="" target={`${percent(metrics.rejected, data.length)}% of Total`} color="#ef4444" progress={45} change="Reject" negative />
        <MetricCard icon={BarChart3} title="Rolled Tonnage" value={fmt(metrics.tonnage, 0)} unit="MT" target="Total Output" color="#ff5a00" progress={88} change="MT" />
        <MetricCard icon={Gauge} title="Avg Yield" value={metrics.yieldAvg.toFixed(2)} unit="%" target="RRS Quality" color="#0b63ce" progress={85} change="Avg" />
        <MetricCard icon={Activity} title="RRS Score" value={(100 - Number(percent(metrics.rejected, data.length))).toFixed(1)} unit="%" target="Rolled Ratio" color="#7c3aed" progress={80} change="Score" />
      </section>

      <section className="status-row">
        <div className="status-card">
          <div className="status-icon" style={{ background: "#16a34a22", color: "#16a34a" }}>
            <Package size={26} />
          </div>
          <div>
            <b>Rolled vs Rejected</b>
            <h4 style={{ color: "#16a34a" }}>{fmt(metrics.rolled)} / {fmt(metrics.rejected)}</h4>
            <span>Coil status summary</span>
          </div>
        </div>
        <button className="alerts-btn" onClick={() => setShowTable(!showTable)}>{showTable ? "Hide Table" : "Show Table"}</button>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="ROLLED VS REJECTED" isEmpty={statusData.length === 0}>
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

        <ChartCard title="DAILY RRS TREND" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="rolled" stroke="#16a34a" strokeWidth={3} dot={false} />
              <Line dataKey="rejected" stroke="#ef4444" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="FURNACE RRS STATUS" isEmpty={furnaceData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={furnaceData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={(key) => sumOf(furnaceData, key)} />} />
              <Bar dataKey="rolled" fill="#16a34a">
                <LabelList dataKey="rolled" content={renderBarTopLabel(sumOf(furnaceData, "rolled"))} />
              </Bar>
              <Bar dataKey="rejected" fill="#ef4444">
                <LabelList dataKey="rejected" content={renderBarTopLabel(sumOf(furnaceData, "rejected"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {showTable && (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr><th>Date</th><th>Coil ID</th><th>Grade</th><th>Furnace</th><th>Weight MT</th><th>Yield %</th><th>Status</th></tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={`${row.coil_id || "row"}-${index}`}>
                    <td>{row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "-"}</td>
                    <td>{row.coil_id || "-"}</td>
                    <td>{row.steel_grade_code || "-"}</td>
                    <td>{row.furnace || "-"}</td>
                    <td>{Number(row.weight || 0).toFixed(2)}</td>
                    <td>{Number(row.yield_percent || 0).toFixed(2)}</td>
                    <td><span className={String(row.status).toUpperCase() === "FAIL" ? "status-badge fail" : "status-badge pass"}>{row.status || "PASS"}</span></td>
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
