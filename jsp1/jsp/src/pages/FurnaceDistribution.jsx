import React, { useState, useMemo} from "react";
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
import { Flame, Package, Gauge, XCircle, BarChart3 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, percent } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, renderBarRightLabel, BarChartTooltip, PieChartTooltip } from "../utils/chartHelpers.jsx";

const COLORS = ["#ff5a00", "#0b63ce", "#16a34a", "#7c3aed", "#0891b2", "#ef4444"];

function furnaceSummary(data) {
  const map = {};

  data.forEach((row) => {
    const furnace = row.furnace || "Unknown";

    if (!map[furnace]) {
      map[furnace] = {
        furnace,
        coils: 0,
        tonnage: 0,
        yieldSum: 0,
        rejects: 0
      };
    }

    map[furnace].coils += 1;
    map[furnace].tonnage += Number(row.weight || 0);
    map[furnace].yieldSum += Number(row.yield_percent || 0);

    if (String(row.status).toUpperCase() === "FAIL") {
      map[furnace].rejects += 1;
    }
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

export default function FurnaceDistribution({ data }) {
  const [showTable, setShowTable] = useState(false);

  const summary = furnaceSummary(data);
  const totalCoils = useMemo(() => data.length, [data]);

const totalTonnage = useMemo(
  () => data.reduce((sum, row) => sum + Number(row.weight || 0), 0),
  [data]
);
  const totalRejects = useMemo(() => data.filter((r) => String(r.status).toUpperCase() === "FAIL").length, [data]);

  const topFurnace = summary[0] || {};
  const bestYield = [...summary].sort((a, b) => b.avgYield - a.avgYield)[0] || {};
  const lowestReject = [...summary].sort((a, b) => a.rejectionRate - b.rejectionRate)[0] || {};

  const avgYield = data.length
    ? data.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / data.length
    : 0;

  const pieData = summary.map((x) => ({
    name: x.furnace,
    value: x.tonnage
  }));

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={Flame}
          title="Total Furnaces"
          value={summary.length}
          unit=""
          target="Active Furnaces"
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
          target="Furnace Production"
          color="#16a34a"
          progress={88}
          change="MT"
        />

        <MetricCard
          icon={Gauge}
          title="Avg Yield"
          value={avgYield.toFixed(2)}
          unit="%"
          target="Furnace Yield"
          color="#7c3aed"
          progress={85}
          change="Avg"
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
          <div className="status-icon" style={{ background: "#ff5a0022", color: "#ff5a00" }}>
            <Flame size={26} />
          </div>
          <div>
            <b>Top Furnace</b>
            <h4 style={{ color: "#ff5a00" }}>{topFurnace.furnace || "N/A"}</h4>
            <span>{fmt(topFurnace.tonnage || 0, 0)} MT production</span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon" style={{ background: "#16a34a22", color: "#16a34a" }}>
            <Gauge size={26} />
          </div>
          <div>
            <b>Best Yield Furnace</b>
            <h4 style={{ color: "#16a34a" }}>{bestYield.furnace || "N/A"}</h4>
            <span>{bestYield.avgYield || 0}% average yield</span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon" style={{ background: "#0b63ce22", color: "#0b63ce" }}>
            <Package size={26} />
          </div>
          <div>
            <b>Lowest Reject Furnace</b>
            <h4 style={{ color: "#0b63ce" }}>{lowestReject.furnace || "N/A"}</h4>
            <span>{lowestReject.rejectionRate || 0}% rejection rate</span>
          </div>
        </div>

        <button className="alerts-btn" onClick={() => setShowTable(!showTable)}>
          {showTable ? "Hide Table" : "Show Table"}
        </button>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="FURNACE-WISE TONNAGE">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} layout="vertical" margin={{ right: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis type="number" />
              <YAxis dataKey="furnace" type="category" width={100} />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#ff5a00" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="tonnage" content={renderBarRightLabel(sumOf(summary, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="FURNACE-WISE COILS">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="furnace" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(summary, "coils")} />} />
              <Bar dataKey="coils" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(summary, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="FURNACE TONNAGE SHARE">
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
                <th>Furnace</th>
                <th>Coils</th>
                <th>Tonnage MT</th>
                <th>Avg Yield %</th>
                <th>Rejects</th>
                <th>Rejection Rate %</th>
              </tr>
            </thead>

            <tbody>
              {summary.map((row) => (
                <tr key={row.furnace}>
                  <td>{row.furnace}</td>
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