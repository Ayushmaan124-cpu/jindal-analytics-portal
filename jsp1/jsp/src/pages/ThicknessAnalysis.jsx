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
import { Ruler, Package, Gauge, XCircle, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, BarChartTooltip, PieChartTooltip } from "../utils/chartHelpers.jsx";

const COLORS = ["#0b63ce", "#ff5a00", "#16a34a", "#7c3aed", "#0891b2", "#ef4444"];

function thicknessSummary(data) {
  const bins = [
    [-Infinity, 2],
    [2, 4],
    [4, 6],
    [6, 8],
    [8, 10],
    [10, 12],
    [12, 14],
    [14, 16],
    [16, 18],
    [18, 20],
    [20, Infinity]
  ];

  return bins.map(([start, end]) => {
    const rows = data.filter((row) => {
      const t = Number(row.thickness || 0);
      if (!t) return false;
      return t >= start && t < end;
    });

    const tonnage = rows.reduce((s, r) => s + Number(r.weight || 0), 0);
    const rejects = rows.filter((r) => String(r.status).toUpperCase() === "FAIL").length;
    const avgYield = rows.length
      ? rows.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / rows.length
      : 0;

    const label = start === -Infinity ? "<2" : end === Infinity ? "20" : `${start}-${end}`;

    return {
      range: label,
      coils: rows.length,
      tonnage: Number(tonnage.toFixed(0)),
      avgYield: Number(avgYield.toFixed(2)),
      rejects,
      rejectionRate: rows.length ? Number(((rejects / rows.length) * 100).toFixed(2)) : 0
    };
  });
}

export default function ThicknessAnalysis({ data }) {
  const [showTable, setShowTable] = useState(false);

  const summary = thicknessSummary(data);
  const activeRanges = summary.filter((x) => x.coils > 0);
  const topRange = [...summary].sort((a, b) => b.tonnage - a.tonnage)[0] || {};

  const totalCoils = data.length;
  const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
  const totalRejects = data.filter((r) => String(r.status).toUpperCase() === "FAIL").length;
  const avgThickness = data.length
    ? data.reduce((s, r) => s + Number(r.thickness || 0), 0) / data.length
    : 0;

  const pieData = activeRanges.map((x) => ({
    name: x.range,
    value: x.tonnage
  }));

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={Ruler}
          title="Avg Thickness"
          value={avgThickness.toFixed(2)}
          unit="mm"
          target="Filtered Average"
          color="#0b63ce"
          progress={80}
          change="Live"
        />

        <MetricCard
          icon={Package}
          title="Total Coils"
          value={fmt(totalCoils)}
          unit="Coils"
          target="Filtered Data"
          color="#ff5a00"
          progress={90}
          change="Live"
        />

        <MetricCard
          icon={BarChart3}
          title="Total Tonnage"
          value={fmt(totalTonnage, 0)}
          unit="MT"
          target="Thickness Production"
          color="#16a34a"
          progress={88}
          change="MT"
        />

        <MetricCard
          icon={Gauge}
          title="Active Ranges"
          value={activeRanges.length}
          unit=""
          target="Thickness Bands"
          color="#7c3aed"
          progress={85}
          change="Ranges"
        />

        <MetricCard
          icon={XCircle}
          title="Rejects"
          value={fmt(totalRejects)}
          unit=""
          target={`${percent(totalRejects, totalCoils)}% of Total`}
          color="#ef4444"
          progress={45}
          change="Monitor"
          negative
        />
      </section>

      <section className="status-row">
        <div className="status-card">
          <div className="status-icon" style={{ background: "#0b63ce22", color: "#0b63ce" }}>
            <Ruler size={26} />
          </div>
          <div>
            <b>Top Thickness Range</b>
            <h4 style={{ color: "#0b63ce" }}>{topRange.range || "N/A"} mm</h4>
            <span>{fmt(topRange.tonnage || 0, 0)} MT production</span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon" style={{ background: "#16a34a22", color: "#16a34a" }}>
            <Gauge size={26} />
          </div>
          <div>
            <b>Best Yield Range</b>
            <h4 style={{ color: "#16a34a" }}>
              {activeRanges.length
                ? [...activeRanges].sort((a, b) => b.avgYield - a.avgYield)[0].range
                : "N/A"}
            </h4>
            <span>Highest yield thickness</span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon" style={{ background: "#ff5a0022", color: "#ff5a00" }}>
            <Package size={26} />
          </div>
          <div>
            <b>Highest Coil Count</b>
            <h4 style={{ color: "#ff5a00" }}>
              {activeRanges.length
                ? [...activeRanges].sort((a, b) => b.coils - a.coils)[0].range
                : "N/A"}
            </h4>
            <span>Max coils by thickness</span>
          </div>
        </div>

        <button className="alerts-btn" onClick={() => setShowTable(!showTable)}>
          {showTable ? "Hide Table" : "Show Table"}
        </button>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="THICKNESS-WISE COILS">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="range" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "coils")} />} />
              <Bar dataKey="coils" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(summary, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="THICKNESS-WISE TONNAGE">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="range" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#ff5a00" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="tonnage" content={renderBarTopLabel(sumOf(summary, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="THICKNESS TONNAGE SHARE">
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
                <th>Thickness Range</th>
                <th>Coils</th>
                <th>Tonnage MT</th>
                <th>Avg Yield %</th>
                <th>Rejects</th>
                <th>Rejection Rate %</th>
              </tr>
            </thead>

            <tbody>
              {summary.map((row) => (
                <tr key={row.range}>
                  <td>{row.range} mm</td>
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