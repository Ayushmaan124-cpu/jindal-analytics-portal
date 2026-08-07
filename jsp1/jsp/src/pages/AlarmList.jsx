import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Flame,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
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
import MetricCard from "../components/MetricCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { fmt } from "../utils/calculations.js";
import { sumOf, renderBarTopLabel, BarChartTooltip } from "../utils/chartHelpers.jsx";

function buildAlerts(data) {
  const alerts = [];

  data.forEach((row, index) => {
    const yieldValue = Number(row.yield_percent || 0);
    const delay = Number(row.delay_minutes || 0);
    const status = String(row.status || "").toUpperCase();

    if (yieldValue < 96) {
      alerts.push({
        id: `AL-YLD-${index}`,
        time: new Date(row.production_date).toLocaleDateString("en-GB"),
        furnace: row.furnace || "Unknown",
        shift: row.shift || "-",
        coil: row.coil_id || "-",
        alert: "Low yield detected",
        severity: "Warning",
        status: "Open"
      });
    }

    if (status === "FAIL") {
      alerts.push({
        id: `AL-REJ-${index}`,
        time: new Date(row.production_date).toLocaleDateString("en-GB"),
        furnace: row.furnace || "Unknown",
        shift: row.shift || "-",
        coil: row.coil_id || "-",
        alert: row.defect_type || "Rejected coil",
        severity: "High",
        status: "Open"
      });
    }

    if (delay > 20) {
      alerts.push({
        id: `AL-DLY-${index}`,
        time: new Date(row.production_date).toLocaleDateString("en-GB"),
        furnace: row.furnace || "Unknown",
        shift: row.shift || "-",
        coil: row.coil_id || "-",
        alert: `Delay exceeded ${delay} minutes`,
        severity: "Critical",
        status: "Open"
      });
    }
  });

  return alerts;
}

function countBy(alerts, key) {
  const map = {};

  alerts.forEach((a) => {
    map[a[key]] = (map[a[key]] || 0) + 1;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value
  }));
}

export default function AlarmList({ data }) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [page, setPage] = useState(1);

  const rowsPerPage = 25;

  const alerts = useMemo(() => buildAlerts(data), [data]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const searchText = search.toLowerCase();

      const matchSearch =
        search === "" ||
        a.alert.toLowerCase().includes(searchText) ||
        a.coil.toLowerCase().includes(searchText) ||
        a.furnace.toLowerCase().includes(searchText);

      const matchSeverity =
        severity === "All" || a.severity === severity;

      return matchSearch && matchSeverity;
    });
  }, [alerts, search, severity]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / rowsPerPage)
  );

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const critical = useMemo(
    () => alerts.filter((a) => a.severity === "Critical").length,
    [alerts]
  );

  const high = useMemo(
    () => alerts.filter((a) => a.severity === "High").length,
    [alerts]
  );

  const warning = useMemo(
    () => alerts.filter((a) => a.severity === "Warning").length,
    [alerts]
  );

  const open = useMemo(
    () => alerts.filter((a) => a.status === "Open").length,
    [alerts]
  );

  const severityData = useMemo(
    () => countBy(alerts, "severity"),
    [alerts]
  );

  const furnaceData = useMemo(
    () => countBy(alerts, "furnace"),
    [alerts]
  );

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={AlertTriangle}
          title="Critical Alerts"
          value={fmt(critical)}
          unit=""
          target="Immediate Action"
          color="#ef4444"
          progress={70}
          change="Critical"
          negative
        />

        <MetricCard
          icon={XCircle}
          title="High Priority"
          value={fmt(high)}
          unit=""
          target="Production Risk"
          color="#ff5a00"
          progress={65}
          change="High"
          negative
        />

        <MetricCard
          icon={AlertTriangle}
          title="Warnings"
          value={fmt(warning)}
          unit=""
          target="Monitor"
          color="#f59e0b"
          progress={55}
          change="Warning"
        />

        <MetricCard
          icon={Flame}
          title="Total Alerts"
          value={fmt(alerts.length)}
          unit=""
          target="Generated Alerts"
          color="#0b63ce"
          progress={85}
          change="Live"
        />

        <MetricCard
          icon={CheckCircle}
          title="Open Alerts"
          value={fmt(open)}
          unit=""
          target="Pending Review"
          color="#7c3aed"
          progress={80}
          change="Open"
        />
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search alert, coil, furnace..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
          >
            <option>All</option>
            <option>Critical</option>
            <option>High</option>
            <option>Warning</option>
          </select>
        </div>
      </section>

      <section className="chart-grid-three">
        <ChartCard title="ALERTS BY SEVERITY" isEmpty={severityData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(severityData, "value")} />} />
              <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="value" content={renderBarTopLabel(sumOf(severityData, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ALERTS BY FURNACE" isEmpty={furnaceData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={furnaceData} margin={{ top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<BarChartTooltip total={sumOf(furnaceData, "value")} />} />
              <Bar dataKey="value" fill="#ff5a00" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="value" content={renderBarTopLabel(sumOf(furnaceData, "value"))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Date</th>
              <th>Furnace</th>
              <th>Shift</th>
              <th>Coil ID</th>
              <th>Alert</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.time}</td>
                <td>{a.furnace}</td>
                <td>{a.shift}</td>
                <td>{a.coil}</td>
                <td>{a.alert}</td>
                <td>
                  <span className={`severity-badge ${a.severity.toLowerCase()}`}>
                    {a.severity}
                  </span>
                </td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-card">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages} | Showing {visibleRows.length} of{" "}
            {filtered.length} alerts
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}