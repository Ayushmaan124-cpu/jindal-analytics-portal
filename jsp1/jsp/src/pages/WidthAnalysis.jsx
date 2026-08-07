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
import { Activity, Package, Gauge, XCircle, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, BarChartTooltip, PieChartTooltip } from "../utils/chartHelpers.jsx";

const COLORS = ["#ff5a00", "#0b63ce", "#16a34a", "#7c3aed", "#0891b2", "#ef4444"];

function widthSummary(data) {
  const bins = [
    [-Infinity, 900],
    [900, 1000],
    [1000, 1100],
    [1100, 1200],
    [1200, 1300],
    [1300, 1400],
    [1400, 1500],
    [1500, 1600],
    [1600, 1700],
    [1700, Infinity]
  ];

  return bins.map(([start, end]) => {
    const rows = data.filter((row) => {
      const w = Number(row.width || 0);
      if (!w) return false;
      return w >= start && w < end;
    });

    const tonnage = rows.reduce((s, r) => s + Number(r.weight || 0), 0);
    const rejects = rows.filter(
      (r) => String(r.status).toUpperCase() === "FAIL"
    ).length;

    const avgYield = rows.length
      ? rows.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / rows.length
      : 0;

    const label = start === -Infinity ? "<900" : end === Infinity ? "1700" : `${start}-${end}`;

    return {
      range: label,
      coils: rows.length,
      tonnage: Number(tonnage.toFixed(0)),
      avgYield: Number(avgYield.toFixed(2)),
      rejects,
      rejectionRate: rows.length
        ? Number(((rejects / rows.length) * 100).toFixed(2))
        : 0
    };
  });
}

export default function WidthAnalysis({ data }) {
  const [showTable, setShowTable] = useState(false);

  const summary = widthSummary(data);
  const activeRanges = summary.filter((x) => x.coils > 0);
  const topRange = [...summary].sort((a, b) => b.tonnage - a.tonnage)[0] || {};

  const totalCoils = data.length;
  const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
  const totalRejects = data.filter(
    (r) => String(r.status).toUpperCase() === "FAIL"
  ).length;

  const avgWidth = data.length
    ? data.reduce((s, r) => s + Number(r.width || 0), 0) / data.length
    : 0;

  const pieData = activeRanges.map((x) => ({
    name: x.range,
    value: x.tonnage
  }));

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={Activity}
          title="Avg Width"
          value={avgWidth.toFixed(0)}
          unit="mm"
          target="Filtered Average"
          color="#ff5a00"
          progress={80}
          change="Live"
        />

        <MetricCard
          icon={Package}
          title="Total Coils"
          value={fmt(totalCoils)}
          unit="Coils"
          target="Filtered Data"
          color="#0b63ce"
          progress={90}
          change="Live"
        />

        <MetricCard
          icon={BarChart3}
          title="Total Tonnage"
          value={fmt(totalTonnage, 0)}
          unit="MT"
          target="Width Production"
          color="#16a34a"
          progress={88}
          change="MT"
        />

        <MetricCard
          icon={Gauge}
          title="Active Ranges"
          value={activeRanges.length}
          unit=""
          target="Width Bands"
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
          <div
            className="status-icon"
            style={{ background: "#ff5a0022", color: "#ff5a00" }}
          >
            <Activity size={26} />
          </div>
          <div>
            <b>Top Width Range</b>
            <h4 style={{ color: "#ff5a00" }}>
              {topRange.range || "N/A"} mm
            </h4>
            <span>{fmt(topRange.tonnage || 0, 0)} MT production</span>
          </div>
        </div>

        <div className="status-card">
          <div
            className="status-icon"
            style={{ background: "#16a34a22", color: "#16a34a" }}
          >
            <Gauge size={26} />
          </div>
          <div>
            <b>Best Yield Range</b>
            <h4 style={{ color: "#16a34a" }}>
              {activeRanges.length
                ? [...activeRanges].sort((a, b) => b.avgYield - a.avgYield)[0]
                    .range
                : "N/A"}
            </h4>
            <span>Highest yield width</span>
          </div>
        </div>

        <div className="status-card">
          <div
            className="status-icon"
            style={{ background: "#0b63ce22", color: "#0b63ce" }}
          >
            <Package size={26} />
          </div>
          <div>
            <b>Highest Coil Count</b>
            <h4 style={{ color: "#0b63ce" }}>
              {activeRanges.length
                ? [...activeRanges].sort((a, b) => b.coils - a.coils)[0].range
                : "N/A"}
            </h4>
            <span>Max coils by width</span>
          </div>
        </div>

        <button className="alerts-btn" onClick={() => setShowTable(!showTable)}>
          {showTable ? "Hide Table" : "Show Table"}
        </button>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="WIDTH-WISE COILS">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="range" interval={0} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "coils")} />} />
              <Bar dataKey="coils" fill="#ff5a00" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(summary, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="WIDTH-WISE TONNAGE">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="range" interval={0} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="tonnage" content={renderBarTopLabel(sumOf(summary, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="WIDTH TONNAGE SHARE">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={false}
                labelLine={false}
              >
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
                <th>Width Range</th>
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