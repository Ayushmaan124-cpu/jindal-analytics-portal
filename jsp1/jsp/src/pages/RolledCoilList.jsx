import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Download,
  RefreshCcw,
  Package,
  BarChart3,
  Gauge
} from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import { fmt } from "../utils/calculations.js";

function downloadCSV(rows) {
  const headers = [
    "production_date",
    "coil_id",
    "steel_grade_code",
    "steel_grade_family",
    "slab_type",
    "thickness",
    "width",
    "furnace",
    "shift",
    "weight",
    "yield_percent",
    "status"
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) =>
          `"${String(
            h === "production_date"
              ? new Date(r[h]).toLocaleDateString("en-GB")
              : r[h] ?? ""
          ).replace(/"/g, '""')}"`
        )
        .join(",")
    )
  ].join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "rolled_coil_list.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function quantile(values, q) {
  const sorted = values
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);

  if (!sorted.length) return 0;

  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export default function RolledCoilList({ data }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const rows = useMemo(
    () =>
      data.filter((r) => {
        const q = search.toLowerCase();

        const searchOk =
          !q ||
          [
            r.coil_id,
            r.steel_grade_code,
            r.steel_grade_family,
            r.slab_type,
            r.furnace
          ].some((v) => String(v || "").toLowerCase().includes(q));

        const statusOk =
          status === "All" || String(r.status).toUpperCase() === status;

        return searchOk && statusOk;
      }),
    [data, search, status]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  const visibleRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalTonnage = rows.reduce(
    (s, r) => s + Number(r.weight || 0),
    0
  );

  const weights = rows
    .map((r) => Number(r.weight || 0))
    .filter((v) => v > 0);

  const avgWeight = weights.length
    ? weights.reduce((s, v) => s + v, 0) / weights.length
    : 0;

  const medianWeight = quantile(weights, 0.5);
  const q1Weight = quantile(weights, 0.25);
  const q3Weight = quantile(weights, 0.75);

  const passed = rows.filter(
    (r) => String(r.status).toUpperCase() !== "FAIL"
  ).length;

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={ClipboardList}
          title="Rolled Coils"
          value={fmt(rows.length)}
          unit="Coils"
          target="Current View"
          color="#ff5a00"
          progress={92}
          change="Live"
        />

        <MetricCard
          icon={Download}
          title="Tonnage"
          value={fmt(totalTonnage, 0)}
          unit="MT"
          target="Rolled Tonnage"
          color="#0b63ce"
          progress={90}
          change="MT"
        />

        <MetricCard
          icon={RefreshCcw}
          title="Avg Weight"
          value={avgWeight.toFixed(2)}
          unit="MT"
          target="Mean Coil Weight"
          color="#7c3aed"
          progress={70}
          change="Mean"
        />

        <MetricCard
          icon={BarChart3}
          title="Median Weight"
          value={medianWeight.toFixed(2)}
          unit="MT"
          target="50th Percentile"
          color="#16a34a"
          progress={75}
          change="Q2"
        />

        <MetricCard
          icon={Gauge}
          title="Q1 / Q3 Weight"
          value={`${q1Weight.toFixed(2)} / ${q3Weight.toFixed(2)}`}
          unit="MT"
          target="25th / 75th Percentile"
          color="#0891b2"
          progress={80}
          change="Quantile"
        />

        <MetricCard
          icon={Package}
          title="Passed Coils"
          value={fmt(passed)}
          unit=""
          target="Accepted Coils"
          color="#16a34a"
          progress={88}
          change="OK"
        />

        <MetricCard
          icon={Search}
          title="Dataset"
          value={fmt(data.length)}
          unit="Rows"
          target="Uploaded Data"
          color="#0891b2"
          progress={100}
          change="All"
        />
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search coil, grade, SGF, slab, furnace..."
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option>All</option>
            <option>PASS</option>
            <option>FAIL</option>
          </select>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className="secondary-btn"
            onClick={() => {
              setSearch("");
              setStatus("All");
              setPage(1);
            }}
          >
            <RefreshCcw size={15} /> Reset
          </button>

          <button
            className="primary-btn"
            onClick={() => downloadCSV(rows)}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Coil ID</th>
              <th>Grade</th>
              <th>SGF</th>
              <th>Slab</th>
              <th>Thickness</th>
              <th>Width</th>
              <th>Furnace</th>
              <th>Shift</th>
              <th>Weight MT</th>
              <th>Yield %</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.production_date).toLocaleDateString("en-GB")}</td>
                <td>{r.coil_id}</td>
                <td>{r.steel_grade_code}</td>
                <td>{r.steel_grade_family}</td>
                <td>{r.slab_type}</td>
                <td>{r.thickness}</td>
                <td>{r.width}</td>
                <td>{r.furnace}</td>
                <td>{r.shift}</td>
                <td>{Number(r.weight || 0).toFixed(2)}</td>
                <td>{Number(r.yield_percent || 0).toFixed(2)}</td>
                <td>
                  <span
                    className={
                      String(r.status).toUpperCase() === "FAIL"
                        ? "status-badge fail"
                        : "status-badge pass"
                    }
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-card">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>

        <span>
          Page {page} of {totalPages} | Showing {visibleRows.length} of{" "}
          {rows.length}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}