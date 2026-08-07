import React, { useMemo, useState } from "react";
import { Database, Search, Download, RefreshCcw, Table2 } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import { fmt } from "../utils/calculations.js";

function downloadCSV(rows) {
  if (!rows.length) return;

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
    "status",
    "defect_type"
  ];

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value =
            key === "production_date"
              ? row[key]
                ? new Date(row[key]).toLocaleDateString("en-GB")
                : ""
              : row[key] ?? "";

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "production_data.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ProductionData({ data }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [shift, setShift] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const searchText = search.toLowerCase();

    return data.filter((row) => {
      const searchPass =
        search.trim() === "" ||
        String(row.coil_id || "").toLowerCase().includes(searchText) ||
        String(row.steel_grade_code || "").toLowerCase().includes(searchText) ||
        String(row.steel_grade_family || "").toLowerCase().includes(searchText) ||
        String(row.customer_name || "").toLowerCase().includes(searchText);

      const statusPass =
        status === "All" || String(row.status || "").toUpperCase() === status;

      const shiftPass = shift === "All" || String(row.shift || "") === shift;

      return searchPass && statusPass && shiftPass;
    });
  }, [data, search, status, shift]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / rowsPerPage)), [filtered, rowsPerPage]);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const totalTonnage = useMemo(() => filtered.reduce((s, r) => s + Number(r.weight || 0), 0), [filtered]);

  const avgYield = useMemo(() => {
    return filtered.length
      ? filtered.reduce((s, r) => s + Number(r.yield_percent || 0), 0) / filtered.length
      : 0;
  }, [filtered]);

  const rejects = useMemo(() => filtered.filter((r) => String(r.status).toUpperCase() === "FAIL").length, [filtered]);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={Database} title="Total Records" value={fmt(data.length)} unit="" target="Uploaded Dataset" color="#0b63ce" progress={100} change="All" />
        <MetricCard icon={Table2} title="Filtered Records" value={fmt(filtered.length)} unit="" target="Current View" color="#ff5a00" progress={90} change="Live" />
        <MetricCard icon={Download} title="Filtered Tonnage" value={fmt(totalTonnage, 0)} unit="MT" target="Current Filter" color="#16a34a" progress={85} change="MT" />
        <MetricCard icon={RefreshCcw} title="Avg Yield" value={avgYield.toFixed(2)} unit="%" target="Filtered Yield" color="#7c3aed" progress={80} change="Avg" />
        <MetricCard icon={Search} title="Rejects" value={fmt(rejects)} unit="" target="Filtered Rejects" color="#ef4444" progress={45} change="Monitor" negative />
      </section>

      <section className="data-toolbar card">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search Coil ID, Grade, SGF, Customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option>All</option>
            <option>PASS</option>
            <option>FAIL</option>
          </select>

          <select value={shift} onChange={(e) => { setShift(e.target.value); setPage(1); }}>
            <option>All</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>

          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button className="secondary-btn" onClick={() => { setSearch(""); setStatus("All"); setShift("All"); setPage(1); }}>
            <RefreshCcw size={15} /> Reset
          </button>
          <button className="primary-btn" onClick={() => downloadCSV(filtered)}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Production Date</th>
              <th>Coil ID</th>
              <th>Grade Code</th>
              <th>SGF</th>
              <th>Slab Type</th>
              <th>Thickness</th>
              <th>Width</th>
              <th>Furnace</th>
              <th>Shift</th>
              <th>Weight MT</th>
              <th>Yield %</th>
              <th>Status</th>
              <th>Defect Type</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${row.coil_id || "row"}-${index}`}>
                <td>{row.production_date ? new Date(row.production_date).toLocaleDateString("en-GB") : "-"}</td>
                <td>{row.coil_id || "-"}</td>
                <td>{row.steel_grade_code || "-"}</td>
                <td>{row.steel_grade_family || "-"}</td>
                <td>{row.slab_type || "-"}</td>
                <td>{row.thickness || "-"}</td>
                <td>{row.width || "-"}</td>
                <td>{row.furnace || "-"}</td>
                <td>{row.shift || "-"}</td>
                <td>{Number(row.weight || 0).toFixed(2)}</td>
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
        <span>Page {page} of {totalPages} | Showing {visibleRows.length} of {filtered.length} records</span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </>
  );
}
