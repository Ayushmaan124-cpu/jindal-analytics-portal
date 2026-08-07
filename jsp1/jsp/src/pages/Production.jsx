import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from "recharts";
import ChartCard from "../components/ChartCard.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { BarChart3, Clock, Package, TrendingUp } from "lucide-react";
import { fmt } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

function groupByShift(data) {
  return ["A", "B", "C"].map((shift) => {
    const rows = data.filter((r) => r.shift === shift);
    return {
      shift: `Shift ${shift}`,
      coils: rows.length,
      tonnage: Number(
        rows.reduce((s, r) => s + Number(r.weight || 0), 0).toFixed(0)
      )
    };
  });
}

function groupByDate(data) {
  const map = {};

  data.forEach((row) => {
    const d = new Date(row.production_date);
    const label = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short"
    });

    if (!map[label]) {
      map[label] = {
        date: label,
        coils: 0,
        tonnage: 0
      };
    }

    map[label].coils += 1;
    map[label].tonnage += Number(row.weight || 0);
  });

  return Object.values(map).map((r) => ({
    ...r,
    tonnage: Number(r.tonnage.toFixed(0))
  }));
}

export default function Production({ data }) {
  const totalCoils = data.length;
  const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
  const avgWeight = totalCoils ? totalTonnage / totalCoils : 0;

  const shiftData = groupByShift(data);
  const dailyData = groupByDate(data);

  return (
    <>
      <section className="production-metrics-grid">
        <MetricCard
          icon={Package}
          title="Production Coils"
          value={fmt(totalCoils)}
          unit="Coils"
          target="Filtered Production"
          color="#ff5a00"
          progress={90}
          change="Live"
        />

        <MetricCard
          icon={BarChart3}
          title="Production Tonnage"
          value={fmt(totalTonnage, 0)}
          unit="MT"
          target="Total Rolled Tonnage"
          color="#0b63ce"
          progress={92}
          change="MT"
        />

        <MetricCard
          icon={Clock}
          title="Avg Coil Weight"
          value={avgWeight.toFixed(1)}
          unit="MT"
          target="Average per Coil"
          color="#16a34a"
          progress={75}
          change="Avg"
        />

        <MetricCard
          icon={TrendingUp}
          title="Active Shifts"
          value={shiftData.filter((s) => s.coils > 0).length}
          unit=""
          target="A / B / C"
          color="#7c3aed"
          progress={80}
          change="Running"
        />
      </section>

      <section className="chart-grid-three">
        <ChartCard title="SHIFT-WISE PRODUCTION COILS">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="shift" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(shiftData, "coils")} />} />
              <Bar dataKey="coils" fill="#ff5a00" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(shiftData, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SHIFT-WISE TONNAGE">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="shift" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(shiftData, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="tonnage" content={renderBarTopLabel(sumOf(shiftData, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="DAILY PRODUCTION TREND">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tonnage"
                stroke="#16a34a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="card page-title">
        <h2>Production Data Table</h2>
        <p>Showing first 50 filtered production records.</p>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Coil ID</th>
              <th>Date</th>
              <th>Shift</th>
              <th>Grade</th>
              <th>SGF</th>
              <th>Slab</th>
              <th>Furnace</th>
              <th>Weight MT</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.slice(0, 50).map((row, index) => (
              <tr key={index}>
                <td>{row.coil_id}</td>
                <td>
                  {new Date(row.production_date).toLocaleDateString("en-GB")}
                </td>
                <td>{row.shift}</td>
                <td>{row.steel_grade_code}</td>
                <td>{row.steel_grade_family}</td>
                <td>{row.slab_type}</td>
                <td>{row.furnace}</td>
                <td>{Number(row.weight || 0).toFixed(2)}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}