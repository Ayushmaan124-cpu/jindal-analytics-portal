import React from "react";

export default function StatusCard({ icon: Icon, title, value, sub, color }) {
  return (
    <div className="status-card">
      <div
        className="status-icon"
        style={{
          background: `${color}22`,
          color
        }}
      >
        <Icon size={26} />
      </div>

      <div>
        <b>{title}</b>
        <h4 style={{ color }}>{value}</h4>
        <span>{sub}</span>
      </div>
    </div>
  );
}