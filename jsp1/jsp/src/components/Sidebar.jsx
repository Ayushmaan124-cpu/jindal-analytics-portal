import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Flame,
  FileSpreadsheet,
  AlertTriangle,
  Target,
  Ruler,
  Activity,
  Download,
  Database,
  Factory
} from "lucide-react";

const menus = [
  {
    title: "OVERVIEW",
    items: [
      { page: "Dashboard", icon: LayoutDashboard },
      
    ]
  },
  {
    title: "GENERAL",
    items: [
      { page: "Shift Information", icon: ClipboardList },
      { page: "Rolled Coil List", icon: ClipboardList },
      { page: "Delay List", icon: ClipboardList },
      { page: "Alarm List", icon: AlertTriangle }
    ]
  },
  {
    title: "QUALITY",
    items: [
      { page: "Quality Factor", icon: ShieldCheck },
      { page: "Quality Information", icon: Target }
    ]
  },
  {
    title: "PRODUCTION",
    items: [
      { page: "Production Trend", icon: BarChart3 },
      { page: "SGF Family Details", icon: Target },
      { page: "Slab Type Analysis", icon: Factory },
      { page: "Thickness Analysis", icon: Ruler },
      { page: "Width Analysis", icon: Activity },
      { page: "CB / EH Usage", icon: Activity },
      { page: "Furnace Distribution", icon: Flame },
      { page: "RRS Analysis", icon: BarChart3 }
    ]
  },
  {
    title: "REPORTS & DOWNLOADS",
    items: [
      { page: "Production Data", icon: Database },
      { page: "Reports & Downloads", icon: Download },
      { page: "Database Status", icon: Database }
    ]
  }
];

export default function Sidebar({ page, setPage, fileName, onUpload }) {
  return (
    <aside className="sidebar">
      <div className="upload-box">
        <Factory size={22} />

        <strong>Data Source</strong>

        <small>{fileName}</small>

        <label className="upload-button">
          Upload Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onUpload}
            hidden
          />
        </label>
      </div>

      {menus.map((section) => (
        <div key={section.title}>
          <div className="sidebar-title">{section.title}</div>

          {section.items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.page}
                className={page === item.page ? "menu active" : "menu"}
                onClick={() => setPage(item.page)}
              >
                <Icon size={18} />
                {item.page}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}