import React from "react";
import { fmt } from "../utils/calculations.js";

export default function DataSummary({ fileName, records }) {
  return (
    <div className="data-summary card">
      <h3>DATA SUMMARY</h3>

      <div className="summary-grid">
        <div>
          <span>Data Source</span>
          <b>Uploaded File</b>
        </div>

        <div>
          <span>File Name</span>
          <b>{fileName || "Sample Production Data"}</b>
        </div>

        <div>
          <span>Total Records</span>
          <b>{fmt(records)}</b>
        </div>

        <div>
          <span>Last Updated</span>
          <b>23 Jun 2026 10:58 AM</b>
        </div>
      </div>
    </div>
  );
}