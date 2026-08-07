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
import { BarChart3, Clock, Package, TrendingUp, Gauge } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt, sumBy } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, renderBarRightLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

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
        date: cleanDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short"
        }),
        coils: 0,
        tonnage: 0,
        yield: 0,
        count: 0
      };
    }

    map[key].coils += 1;
    map[key].tonnage += Number(row.weight || 0);
    map[key].yield += Number(row.yield_percent || 0);
    map[key].count += 1;
  });

  return Object.values(map)
    .map((item) => ({
      ...item,
      tonnage: Number(item.tonnage.toFixed(0)),
      yield: item.count ? Number((item.yield / item.count).toFixed(2)) : 0
    }))
    .sort((a, b) => a.dateObj - b.dateObj);
}


function groupShift(data) {
  const shiftMap = { A: { shift: "Shift A", coils: 0, tonnage: 0 }, B: { shift: "Shift B", coils: 0, tonnage: 0 }, C: { shift: "Shift C", coils: 0, tonnage: 0 } };

  data.forEach((row) => {
    const s = row.shift || "";
    if (!shiftMap[s]) return;
    shiftMap[s].coils += 1;
    shiftMap[s].tonnage += Number(row.weight || 0);
  });

  return Object.values(shiftMap).map((x) => ({
    ...x,
    tonnage: Number(x.tonnage.toFixed(0))
  }));
}

export default function ProductionTrend({ data }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const dailyData = useMemo(() => groupDaily(data), [data]);
  const shiftData = useMemo(() => groupShift(data), [data]);
  const gradeData = useMemo(() => sumBy(data, "steel_grade_code").slice(0, 8), [data]);

  const totals = useMemo(() => {
    const totalCoils = data.length;
    const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
    const avgYield = totalCoils
      ? data.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / totalCoils
      : 0;

    return { totalCoils, totalTonnage, avgYield };
  }, [data]);

  const activeDays = dailyData.length;
  const avgDailyTonnage = activeDays ? totals.totalTonnage / activeDays : 0;

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page]);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={Package} title="Total Coils" value={fmt(totals.totalCoils)} unit="Coils" target="Filtered Data" color="#ff5a00" progress={90} change="Live" />
        <MetricCard icon={BarChart3} title="Total Tonnage" value={fmt(totals.totalTonnage, 0)} unit="MT" target="Rolled Tonnage" color="#0b63ce" progress={92} change="MT" />
        <MetricCard icon={Gauge} title="Avg. Yield" value={totals.avgYield.toFixed(2)} unit="%" target="Quality Indicator" color="#16a34a" progress={88} change="Good" />
        <MetricCard icon={Clock} title="Active Days" value={activeDays} unit="" target="Production Dates" color="#7c3aed" progress={75} change="Days" />
        <MetricCard icon={TrendingUp} title="Avg Daily MT" value={fmt(avgDailyTonnage, 0)} unit="MT" target="Daily Average" color="#0891b2" progress={80} change="Avg" />
      </section>

      <section className="chart-grid-three">
        <ChartCard title="DAILY PRODUCTION TONNAGE" isEmpty={dailyData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tonnage" stroke="#ff5a00" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="DAILY COIL COUNT" isEmpty={dailyData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(dailyData, "coils")} />} />
              <Bar dataKey="coils" fill="#0b63ce" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="coils" content={renderBarTopLabel(sumOf(dailyData, "coils"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SHIFT-WISE TONNAGE" isEmpty={shiftData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="shift" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(shiftData, "tonnage")} unit="MT" />} />
              <Bar dataKey="tonnage" fill="#16a34a" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="tonnage" content={renderBarTopLabel(sumOf(shiftData, "tonnage"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="chart-grid-four">
        <ChartCard title="GRADE-WISE TONNAGE" isEmpty={gradeData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeData} layout="vertical" margin={{ right: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip content={<BarChartTooltip total={sumOf(gradeData, "value")} unit="MT" />} />
              <Bar dataKey="value" fill="#ff5a00" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="value" content={renderBarRightLabel(sumOf(gradeData, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="YIELD TREND" isEmpty={dailyData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis domain={[90, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="yield" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
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
              <th>Yield %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${row.coil_id || "row"}-${index}`}>
                <td>{row.coil_id || "-"}</td>
                <td>{row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "-"}</td>
                <td>{row.shift || "-"}</td>
                <td>{row.steel_grade_code || "-"}</td>
                <td>{row.steel_grade_family || "-"}</td>
                <td>{row.slab_type || "-"}</td>
                <td>{row.furnace || "-"}</td>
                <td>{Number(row.weight || 0).toFixed(2)}</td>
                <td>{Number(row.yield_percent || 0).toFixed(2)}</td>
                <td>{row.status || "-"}</td>
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
  );
}
