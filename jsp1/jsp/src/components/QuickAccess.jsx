import React from "react";
import { BarChart3, ShieldCheck, Flame, Users, Wrench } from "lucide-react";

const items = [
  ["Production Trend", "View Details", BarChart3],
  ["Quality Factor", "Analyze", ShieldCheck],
  ["Furnace Distribution", "View Details", Flame],
  ["RRS Analysis", "View Report", Users],
  ["CB / EH Usage", "View Details", Wrench]
];

export default function QuickAccess({ setPage }) {
  return (
    <div className="quick-access card">
      <h3>QUICK ACCESS</h3>

      <div className="quick-grid">
        {items.map(([title, subtitle, Icon]) => (
          <button key={title} onClick={() => setPage(title)}>
            <Icon size={24} />
            <div>
              <b>{title}</b>
              <span>{subtitle} →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}