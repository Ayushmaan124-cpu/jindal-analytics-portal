import React, { useEffect, useMemo, useState } from "react";
import {Eye, EyeOff} from "lucide-react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Overview from "./pages/Overview.jsx";
import { makeSampleData, readExcelFile } from "./utils/dataLoader.js";
import { applyFilters } from "./utils/filters.js";

import Production from "./pages/Production.jsx";
import ShiftInformation from "./pages/ShiftInformation.jsx";
import RolledCoilList from "./pages/RolledCoilList.jsx";
import DelayList from "./pages/DelayList.jsx";
import AlarmList from "./pages/AlarmList.jsx";
import QualityFactor from "./pages/QualityFactor.jsx";
import QualityInformation from "./pages/QualityInformation.jsx";
import ProductionTrend from "./pages/ProductionTrend.jsx";
import SGFFamilyDetails from "./pages/SGFFamilyDetails.jsx";
import SlabTypeAnalysis from "./pages/SlabTypeAnalysis.jsx";
import ThicknessAnalysis from "./pages/ThicknessAnalysis.jsx";
import WidthAnalysis from "./pages/WidthAnalysis.jsx";
import CBEHUsage from "./pages/CBEHUsage.jsx";
import FurnaceDistribution from "./pages/FurnaceDistribution.jsx";
import RRSAnalysis from "./pages/RRSAnalysis.jsx";
import ProductionData from "./pages/ProductionData.jsx";
import ReportsDownloads from "./pages/ReportsDownloads.jsx";
import DatabaseStatus from "./pages/DatabaseStatus.jsx";
const API_BASE = "https://jindal-hsm-analytics-api.onrender.com";
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const[password, setPassword] = useState("");
  const [page, setPage] = useState("Overview");
const[loginError, setLoginError] = useState("");
const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState(makeSampleData());
  const [dbData, setDbData] = useState([]);
  const [fileName, setFileName] = useState("Sample Production Data");
  const [dataSource, setDataSource] = useState("Sample Data");
  const[loginLoading, setLoginLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const[dbLoading, setDbLoading] = useState(false);
  const[lastUpdated, setLastUpdated] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const user = { name: "Plant Manager", role: "Admin" };

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    shift: "All Shifts",
    grade: "All",
    sgf: "All",
    slab: "All",
    customer: "All"

  });

  useEffect(() => {
  async function loadDatabaseData() {
    try {
      const response = await fetch(`${API_BASE}/api/database-production`);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const json = await response.json();

      if (json?.data?.length > 0) {
        setDbData(json.data);
      }
    } catch (error) {
      console.error("Database load failed:", error);
    }
  }

  loadDatabaseData();
}, []);

  const useDatabaseData = async () => {
  try {
    setDbLoading(true);

    let url = `${API_BASE}/api/database-production`;
    const query = new URLSearchParams();

    if (filters.startDate && filters.endDate) {
      query.append("startDate", filters.startDate);
      query.append("endDate", filters.endDate);
    }

    if (filters.grade && filters.grade !== "All") {
      query.append("grade", filters.grade);
    }

    if (filters.sgf && filters.sgf !== "All") {
      query.append("sgf", filters.sgf);
    }

    if (filters.customer && filters.customer !== "All") {
      query.append("customer", filters.customer);
    }

    if (filters.shift && filters.shift !== "All Shifts") {
      query.append("shift", filters.shift);
    }

    if (filters.startTime) {
      query.append("startTime", filters.startTime);
    }

    if (filters.endTime) {
      query.append("endTime", filters.endTime);
    }

    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const json = await response.json();

    if (!json?.data?.length) {
      alert("No database records found.");
      return;
    }

    setDbData(json.data);
    setData(json.data);
    setLastUpdated(json.last_updated || new Date().toLocaleString());
    setFileName(
      filters.startDate && filters.endDate
        ? `SQL Data ${filters.startDate} to ${filters.endDate}`
        : "JSPL SQL Server - Last 7 Days"
    );
    setDataSource("Database");
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setDbLoading(false);
  }
};
useEffect(() =>{
  if(dataSource!=="Database") return;
  useDatabaseData();
  const interval=setInterval(()=>{
    useDatabaseData();
  }, 30000); // Update every minute

  return () => clearInterval(interval);
}, [dataSource,filters.startDate, filters.endDate, filters.grade, filters.sgf, filters.customer, filters.shift, filters.startTime, filters.endTime]);

  const options = useMemo(
    () => ({
      grades: [...new Set(data.map((r) => r.steel_grade_code).filter(Boolean))],
      sgfs: [...new Set(data.map((r) => r.steel_grade_family).filter(Boolean))],
      slabs: [...new Set(data.map((r) => r.slab_type).filter(Boolean))],
      customers: [...new Set(data.map((r) => r.customer_name).filter(Boolean))]
    }),
    [data]
  );

  const filteredData = useMemo(
    () => applyFilters(data, filters),
    [data, filters]
  );

 const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `${API_BASE}/api/upload-excel`,
      {
        method: "POST",
        body: formData,
      }
    );

    const json = await response.json();

    setData(json.data);
    setFileName(file.name);
    setDataSource("Uploaded Excel");
    setPage("Overview");

  } catch (err) {
    console.error(err);
    alert("Excel upload failed.");
  }
};
  const handleLogin = ()=> {
  if(username=="admin" && password==="jspl123"){
    setLoginError("");
    setLoginLoading(true);
    setTimeout(()=>{
      setIsLoggedIn(true);
      setLoginLoading(false);
    }, 900);
  }
  else{
    setLoginError("Invalid Credentials");
  }
  };
  const handleKeyDown=(e) => {
    if(e.key==="Enter"){
      handleLogin();
    }
  };
  

  const commonProps = {
    data: filteredData,
    filters,
    setFilters,
    options,
    fileName,
    setPage
  };

  const renderPage = () => {
    switch (page) {
      case "Overview":
        return <Overview {...commonProps} />;

      case "Shift Information":
        return <ShiftInformation data={filteredData} />;

      case "Rolled Coil List":
        return <RolledCoilList data={filteredData} />;

      case "Delay List":
        return <DelayList data={filteredData} />;

      case "Alarm List":
        return <AlarmList data={filteredData} />;

      case "Quality":
      case "Quality Factor":
        return <QualityFactor data={filteredData} />;

      case "Quality Information":
        return <QualityInformation data={filteredData} />;

      case "Production":
        return <Production data={filteredData} />;

      case "Production Trend":
        return <ProductionTrend data={filteredData} />;

      case "SGF Family Details":
        return <SGFFamilyDetails data={filteredData} />;

      case "Slab Type Analysis":
        return <SlabTypeAnalysis data={filteredData} />;

      case "Thickness Analysis":
        return <ThicknessAnalysis data={filteredData} />;

      case "Width Analysis":
        return <WidthAnalysis data={filteredData} />;

      case "CB / EH Usage":
        return <CBEHUsage data={filteredData} />;

      case "Furnace Distribution":
        return <FurnaceDistribution data={filteredData} />;

      case "RRS Analysis":
        return <RRSAnalysis data={filteredData} />;

      case "Production Data":
        return <ProductionData data={filteredData} />;

      case "Reports & Downloads":
      case "Reports":
        return <ReportsDownloads data={filteredData} fileName={fileName} />;

      case "Database Status":
        return (
          <DatabaseStatus
            dataSource={dataSource}
            dbConnected={dbData.length > 0}
            records={dataSource === "Database" ? dbData.length : data.length}
            fileName={fileName}
          />
        );

      default:
        return <Overview {...commonProps} />;
    }
  };
  if(showSplash){
    return (
      <div className="splash-screen">
        <div className="splash-box">
          <h1>JSPL HSM Analytics</h1>
          <p>Production Monitoring & Reporting System</p>
          <div className="splash-loader"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>JSPL HSM Analytics</h1>
          <p>Production Monitoring & Reporting System</p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="password-wrapper">
            <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </span>
          </div>

          <button onClick={handleLogin} disabled={loginLoading}>
            Login
          </button>

          {loginError && <p className="login-error">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header user={user}
      onLogout={() => setIsLoggedIn(false)}
       />

      <div className="data-source-bar">
  <span>
    Data Source: <strong>{dataSource}</strong>
  </span>

  <span style={{ marginLeft: 20 }}>
    Last Updated: <strong>{lastUpdated || "--"}</strong>
  </span>

  {dbLoading && (
    <span className="filter-loading">
      <span className="mini-spinner"></span>
      Applying filters...
    </span>
  )}

  <button onClick={useDatabaseData} disabled={dbLoading}>
    {dbLoading ? "Loading..." : dataSource === "Database" ? "Refresh Database" : "Use Database Data"}
  </button>
</div>
      <div className="app-layout">
        <Sidebar
          page={page}
          setPage={setPage}
          fileName={fileName}
          onUpload={handleFileUpload}
        />

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
