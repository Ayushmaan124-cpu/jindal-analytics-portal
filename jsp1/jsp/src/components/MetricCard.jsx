import React from "react";

export default function MetricCard({
  icon: Icon,
  title,
  value,
  unit,
  target,
  color,
  progress,
  change,
  negative
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: color }}>
        <Icon size={28} />
      </div>

      <div className="metric-content">
        <div className="metric-title">{title}</div>
        <small>Today</small>

        <h2>
          {value} <span>{unit}</span>
        </h2>

        <div className="metric-bottom">
          <span>{target}</span>
          <b className={negative ? "negative" : "positive"}>{change}</b>
        </div>

        <div className="metric-progress">
          <div style={{ width: `${progress}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}