import React, { useEffect, useState } from "react";
import { CalendarDays, Clock, Bell } from "lucide-react";
import logo from "../assets/logo.svg";

export default function Header({user, onLogout }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const liveDate = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const liveTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Jindal Steel" className="logo" />

        <div>
          <h1>JINDAL STEEL HSM ANALYTICS PORTAL</h1>
          <p>Hot Strip Mill Production Monitoring & Reporting System</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-info">
          <CalendarDays size={20} />
          <span>{liveDate}</span>
        </div>

        <div className="header-info">
          <Clock size={20} />
          <span>{liveTime}</span>
        </div>

        <div className="notification">
          <Bell size={22} />
          <span>5</span>
        </div>

        <div className="avatar">PM</div>

        <div className="user">
          <strong>{user?.name || "Plant Manager"}</strong>
          <small>Admin • Online</small>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}