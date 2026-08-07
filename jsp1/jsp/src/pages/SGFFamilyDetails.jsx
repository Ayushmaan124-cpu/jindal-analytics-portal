import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from "recharts";
import { Layers, Package, Gauge, XCircle, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, sumBy, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, renderBarRightLabel, BarChartTooltip, PieChartTooltip } from "../utils/chartHelpers.jsx";

const COLORS = ["#ff5a00", "#0b63ce", "#16a34a", "#7c3aed", "#0891b2", "#ef4444"];

function sgfSummary(data) {
  const map = {};

  data.forEach((row) => {
    const sgf = row.steel_grade_family || "Unknown";

    if (!map[sgf]) {
      map[sgf] = { sgf, coils: 0, tonnage: 0, yieldSum: 0, rejects: 0 };
    }

    map[sgf].coils += 1;
    map[sgf].tonnage += Number(row.weight || 0);
    map[sgf].yieldSum += Number(row.yield_percent || 0);

    if (String(row.status).toUpperCase() === "FAIL") map[sgf].rejects += 1;
  });

  return Object.values(map)
    .map((x) => ({
      ...x,
      tonnage: Number(x.tonnage.toFixed(0)),
      avgYield: x.coils ? Number((x.yieldSum / x.coils).toFixed(2)) : 0,
      rejectionRate: x.coils ? Number(((x.rejects / x.coils) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.tonnage - a.tonnage);
}

export default function SGFFamilyDetails({ data }) {
  const [showTable, setShowTable] = useState(false);
  const [showAllTonnage, setShowAllTonnage] = useState(false);
  const [showAllCoils, setShowAllCoils] = useState(false);

  const summary = sgfSummary(data);
  const tonnageChartData = showAllTonnage ? summary : summary.slice(0, 10);
  const coilsChartData = showAllCoils
    ? [...summary].sort((a, b) => b.coils - a.coils)
    : [...summary].sort((a, b) => b.coils - a.coils).slice(0, 10);

  const topSgf = summary[0] || {};
  const totalCoils = data.length;
  const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
  const totalRejects = data.filter((r) => String(r.status).toUpperCase() === "FAIL").length;
  const avgYield = data.length ? data.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / data.length : 0;

  const pieData = sumBy(data, "steel_grade_family").slice(0, 6);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={Layers} title="SGF Families" value={summary.length} unit="" target="Unique Families" color="#ff5a00" progress={80} change="Live" />
        <MetricCard icon={Package} title="Total Coils" value={fmt(totalCoils)} unit="Coils" target="Filtered Data" color="#0b63ce" progress={90} change="Live" />
        <MetricCard icon={BarChart3} title="Total Tonnage" value={fmt(totalTonnage, 0)} unit="MT" target="SGF Production" color="#16a34a" progress={88} change="MT" />
        <MetricCard icon={Gauge} title="Avg Yield" value={avgYield.toFixed(2)} unit="%" target="SGF Quality" color="#7c3aed" progress={85} change="Avg" />
        <MetricCard icon={XCircle} title="Rejects" value={fmt(totalRejects)} unit="" target={`${percent(totalRejects, totalCoils)}% of Total`} color="#ef4444" progress={45} change="Monitor" negative />
      </section>

      <section className="status-row">
        <div className="status-card">
          <div className="status-icon" style={{ background: "#ff5a0022", color: "#ff5a00" }}>
            <Layers size={26} />
          </div>
          <div>
            <b>Top SGF Family</b>
            <h4 style={{ color: "#ff5a00" }}>{topSgf.sgf || "N/A"}</h4>
            <span>{fmt(topSgf.tonnage || 0, 0)} MT production</span>
          </div>
        </div>

        <button className="alerts-btn" onClick={() => setShowTable(!showTable)}>
          {showTable ? "Hide Table" : "Show Table"}
        </button>
      </section>

      <section className="chart-grid-three">
        <ChartCard title={showAllTonnage ? "SGF-WISE TONNAGE - ALL" : "TOP 10 SGF-WISE TONNAGE"}>
          <button className="secondary-btn" onClick={() => setShowAllTonnage(!showAllTonnage)}>
            {showAllTonnage ? "Show Top 10" : "Show All"}
          </button>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tonnageChartData} layout="vertical" margin={{ right: 90, top: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis type="number" />
              <YAxis dataKey="sgf" type="category" width={90} />
              <Tooltip content={<BarChartTooltip total={sumOf(tonnageChartData, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#ff5a00" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="tonnage" content={renderBarRightLabel(sumOf(tonnageChartData, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={showAllCoils ? "SGF-WISE COILS - ALL" : "TOP 10 SGF-WISE COILS"}>
          <button className="secondary-btn" onClick={() => setShowAllCoils(!showAllCoils)}>
            {showAllCoils ? "Show Top 10" : "Show All"}
          </button>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coilsChartData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="sgf" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(coilsChartData, "coils")} />} />
              <Bar dataKey="coils" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(coilsChartData, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SGF TONNAGE SHARE">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label={false} labelLine={false}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip total={sumOf(pieData, "value")} unit="MT" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {showTable && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>SGF Family</th>
                <th>Coils</th>
                <th>Tonnage MT</th>
                <th>Avg Yield %</th>
                <th>Rejects</th>
                <th>Rejection Rate %</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.sgf}>
                  <td>{row.sgf}</td>
                  <td>{fmt(row.coils)}</td>
                  <td>{fmt(row.tonnage, 0)}</td>
                  <td>{row.avgYield.toFixed(2)}</td>
                  <td>{fmt(row.rejects)}</td>
                  <td>{row.rejectionRate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}