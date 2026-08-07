import React from "react";
import {
  Database,
  CheckCircle,
  Server,
  Table,
  Clock
} from "lucide-react";

export default function DatabaseStatus({
  dataSource,
  dbConnected,
  records,
  fileName
}) {
  return (
  <>
    <section className="metrics-grid">
      <div className="metric-card">
        <Database size={28} />
        <h3>Database</h3>
        <h2>SQLite</h2>
      </div>

      <div className="metric-card">
        <CheckCircle
          size={28}
          color={dbConnected ? "#22c55e" : "#ef4444"}
        />
        <h3>Status</h3>
        <h2>{dbConnected ? "Connected" : "Offline"}</h2>
      </div>

      <div className="metric-card">
        <Table size={28} />
        <h3>Total Records</h3>
        <h2>{records}</h2>
      </div>

      <div className="metric-card">
        <Server size={28} />
        <h3>Current Source</h3>
        <h2>{dataSource}</h2>
      </div>

      <div className="metric-card">
        <Clock size={28} />
        <h3>Loaded File</h3>
        <h2>{fileName}</h2>
      </div>
    </section>

    <div className="table-card">
      <h2 style={{ marginBottom: "20px" }}>Database Information</h2>

      <table>
        <tbody>
          <tr>
            <td><b>Database Type</b></td>
            <td>SQLite</td>
          </tr>

          <tr>
            <td><b>Status</b></td>
            <td>{dbConnected ? "🟢 Connected" : "🔴 Offline"}</td>
          </tr>

          <tr>
            <td><b>Current Source</b></td>
            <td>{dataSource}</td>
          </tr>

          <tr>
            <td><b>Rows Available</b></td>
            <td>{records}</td>
          </tr>

          <tr>
            <td><b>Loaded File</b></td>
            <td>{fileName}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </>
);
}