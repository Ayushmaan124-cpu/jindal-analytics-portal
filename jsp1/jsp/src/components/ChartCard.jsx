import React from "react";

export default function ChartCard({ title, children, isEmpty = false }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        <span>Filtered Date Range</span>
      </div>

      <div className="chart-body">
        {isEmpty ? (
          <div className="no-data-box">
            <h4>No Data Available</h4>
            <p>Change filters or upload valid production data.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}