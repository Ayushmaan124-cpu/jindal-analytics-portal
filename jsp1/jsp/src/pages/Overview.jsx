import React, {useMemo} from "react";
import FilterPanel from "../components/FilterPanel.jsx";
import QuickAccess from "../components/QuickAccess.jsx";
import DataSummary from "../components/DataSummary.jsx";
import {fmt , percent, isValidCategory, sumBy} from "../utils/calculations.js";
import {
  BarChart3,
  BarChart2,
  Clock,
  Gauge,
  XCircle,
  CheckCircle,
  Target,
  Package,
  Flame
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  LabelList
} from "recharts";

import MetricCard from "../components/MetricCard.jsx";
import StatusCard from "../components/StatusCard.jsx";
import AIAssistant from "../components/AIAssistant.jsx";
import ChartCard from "../components/ChartCard.jsx";
import {
  sumOf,
  renderBarTopLabel,
  BarChartTooltip,
  THICKNESS_RANGES,
  WIDTH_RANGES,
  buildFixedRangeHistogram
} from "../utils/chartHelpers.jsx";


const COLORS = ["#ff5a00", "#0b63ce", "#16a34a", "#7c3aed", "#0891b2", "#ef4444"];

function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function buildDailyData(data, filters) {
  const grouped = data.reduce((map, row) => {
    const d = new Date(row.production_date);
    if (Number.isNaN(d.getTime())) return map;

    const clean = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const key = localDateKey(clean);

    if (!map[key]) {
      map[key] = {
        dateObj: clean,
        date: clean.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        tonnage: 0,
        coils: 0,
        yield: 0,
        n: 0
      };
    }

    map[key].tonnage += Number(row.weight || 0);
    map[key].coils += 1;
    map[key].yield += Number(row.yield_percent || 0);
    map[key].n += 1;
    return map;
  }, {});

  const dates = data.map((r) => new Date(r.production_date)).filter((d) => !Number.isNaN(d.getTime()));

  let start = filters?.startDate ? new Date(filters.startDate) : dates.length ? new Date(Math.min(...dates)) : null;
  let end = filters?.endDate ? new Date(filters.endDate) : dates.length ? new Date(Math.max(...dates)) : null;

  if (!start || !end) return [];

  start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  end = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const finalData = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const clean = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const key = localDateKey(clean);

    if (grouped[key]) {
      finalData.push({
        ...grouped[key],
        tonnage: Number(grouped[key].tonnage.toFixed(0)),
        yield: grouped[key].n > 0 ? Number((grouped[key].yield / grouped[key].n).toFixed(2)) : 0
      });
    } else {
      finalData.push({
        dateObj: clean,
        date: clean.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        tonnage: 0,
        coils: 0,
        yield: 0,
        n: 0
      });
    }
  }

  return finalData
  .filter((d)=>d.tonnage>0)
  .sort((a, b) => a.dateObj - b.dateObj);
}

function binCount(data, field, bins) {
  return bins.slice(0, -1).map((start, index) => {
    const end = bins[index + 1];
    return {
      name: `${start}-${end}`,
      value: data.filter((row) => Number(row[field]) >= start && Number(row[field]) < end).length
    };
  });
}
function getQuantile(values,q)
{
  const sorted= values.filter((v)=> Number.isFinite(v)).sort((a,b)=>a-b);
  if(!sorted.length) return 0;
  const pos= (sorted.length-1)*q;
  const base= Math.floor(pos);
  const rest= pos-base;
  return sorted[base+1]!==undefined? sorted[base]+rest*(sorted[base+1]-sorted[base]): sorted[base];
}
function buildHourlyTPH(data, filters) {
  if (!data.length) return [];

  const validDates = data
    .map((row) => new Date(row.production_date))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (!validDates.length) return [];

  const latestDateObj = new Date(Math.max(...validDates.map((d) => d.getTime())));

  const latestDateKey = localDateKey(
    new Date(
      latestDateObj.getFullYear(),
      latestDateObj.getMonth(),
      latestDateObj.getDate()
    )
  );

  const latestDateData = data.filter((row) => {
    const d = new Date(row.production_date);
    if (Number.isNaN(d.getTime())) return false;

    const rowDateKey = localDateKey(
      new Date(d.getFullYear(), d.getMonth(), d.getDate())
    );

    return rowDateKey === latestDateKey;
  });

  const map = {};

  latestDateData.forEach((row) => {
    const d = new Date(row.production_date);
    const hour = d.getHours();
    const key = `${String(hour).padStart(2, "0")}:00`;

    if (!map[key]) {
      map[key] = {
        hour: key,
        tonnage: 0,
        coils: 0
      };
    }

    map[key].tonnage += Number(row.weight || 0);
    map[key].coils += 1;
  });

  const finalData = [];

  for (let h = 0; h <= 23; h++) {
    const key = `${String(h).padStart(2, "0")}:00`;

    finalData.push({
      hour: key,
      tonnage: Number((map[key]?.tonnage || 0).toFixed(0)),
      coils: map[key]?.coils || 0,
      tph: Number((map[key]?.tonnage || 0).toFixed(2))
    });
  }

  return finalData;
}

export default function Overview({ data, filters, setFilters, options, fileName, setPage }) {
  const totalCoils = data.length;
  const totalTonnage = data.reduce((sum, row) => sum + Number(row.weight || 0), 0);
  const avgYield = data.length
    ? data.reduce((sum, row) => sum + Number(row.yield_percent || 0), 0) / data.length
    : 0;
  const rejects = data.filter((row) => String(row.status).toUpperCase() === "FAIL").length;
const weights = data.map((row) => Number(row.weight || 0)).filter((v) => v > 0);

const avgWeight = weights.length
  ? weights.reduce((s, v) => s + v, 0) / weights.length
  : 0;

const q1Weight = getQuantile(weights, 0.25);
const medianWeight = getQuantile(weights, 0.5);
const q3Weight = getQuantile(weights, 0.75);

const firstTime = data.length
  ? new Date(Math.min(...data.map((r) => new Date(r.production_date)).filter((d) => !Number.isNaN(d)).map((d) => d.getTime())))
  : null;

const lastTime = data.length
  ? new Date(Math.max(...data.map((r) => new Date(r.production_date)).filter((d) => !Number.isNaN(d)).map((d) => d.getTime())))
  : null;

const latestProductionDate = data.length
  ? new Date(
      Math.max(
        ...data
          .map((r) => new Date(r.production_date))
          .filter((d) => !Number.isNaN(d.getTime()))
          .map((d) => d.getTime())
      )
    )
  : null;

const latestDateKey = latestProductionDate
  ? localDateKey(
      new Date(
        latestProductionDate.getFullYear(),
        latestProductionDate.getMonth(),
        latestProductionDate.getDate()
      )
    )
  : null;

const latestDayData = latestDateKey
  ? data.filter((row) => {
      const d = new Date(row.production_date);
      if (Number.isNaN(d.getTime())) return false;

      const rowDateKey = localDateKey(
        new Date(d.getFullYear(), d.getMonth(), d.getDate())
      );

      return rowDateKey === latestDateKey;
    })
  : [];

const latestDayTonnage = latestDayData.reduce(
  (sum, row) => sum + Number(row.weight || 0),
  0
);

const latestDayTimes = latestDayData
  .map((row) => new Date(row.production_date))
  .filter((d) => !Number.isNaN(d.getTime()));

const latestFirstTime = latestDayTimes.length
  ? new Date(Math.min(...latestDayTimes.map((d) => d.getTime())))
  : null;

const latestLastTime = latestDayTimes.length
  ? new Date(Math.max(...latestDayTimes.map((d) => d.getTime())))
  : null;

const latestDurationHours =
  latestFirstTime && latestLastTime
    ? (latestLastTime - latestFirstTime) / (1000 * 60 * 60)
    : 0;

const tph =
  latestDurationHours > 0
    ? latestDayTonnage / latestDurationHours
    : 0;

const tphSummary =
  tph === 0
    ? "TPH cannot be calculated because valid production time is not available."
    : `TPH is ${tph.toFixed(2)} MT/hr for the latest data. Latest day tonnage is ${fmt(latestDayTonnage, 0)} MT over ${latestDurationHours.toFixed(2)} hours. If TPH is low, it may be due to lower rolled tonnage, larger time gaps between coils, furnace delay, mill delay, or waiting time.`;
  const topSgf = sumBy(data, "steel_grade_family")
  .filter((x) => isValidCategory(x.name))[0] || {};
  const topSlab = sumBy(data, "slab_type")
  .filter((x) => isValidCategory(x.name))[0] || {};
  const topFurnace = sumBy(data, "furnace")
  .filter((x) => isValidCategory(x.name))[0] || {};

  const daily = useMemo(
  () => buildDailyData(data, filters),
  [data, filters]
);

const sgfData = useMemo(
  () => sumBy(data, "steel_grade_family")
  .filter((x) => isValidCategory(x.name))
  .slice(0, 6),
  [data]
);

const slabData = useMemo(
  () => sumBy(data, "slab_type")
  .filter((x) => isValidCategory(x.name))
  .slice(0, 6),
  [data]
);

const thicknessData = useMemo(
  () => buildFixedRangeHistogram(data, (row) => row.thickness, THICKNESS_RANGES),
  [data]
);

const widthData = useMemo(
  () => buildFixedRangeHistogram(data, (row) => row.width, WIDTH_RANGES),
  [data]
);
const hourlyTPH = useMemo(
  () => buildHourlyTPH(data, filters),
  [data, filters]
);

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon={BarChart3} title="Total Coils" value={fmt(totalCoils)} unit="Coils" target="Target: 1,320 Coils" color="#ff5a00" progress={94} change="94.5%" />
        <MetricCard icon={Clock} title="Total Tonnage" value={fmt(totalTonnage, 0)} unit="MT" target="Target: 47,000 MT" color="#0b63ce" progress={96} change="96.3%" />
        <MetricCard icon={Gauge} title="Avg. Yield (%)" value={avgYield.toFixed(2)} unit="%" target="Target: 97.50 %" color="#16a34a" progress={90} change="+0.62%" />
        <MetricCard icon={XCircle} title="Total Rejects" value={fmt(rejects)} unit="" target={`${percent(rejects, totalCoils)}% of Total`} color="#7c3aed" progress={45} change="-4.3%" negative />
      <MetricCard
  icon={Gauge}
  title="TPH"
  value={tph.toFixed(2)}
  unit="MT/hr"
  target="Tonnage Per Hour"
  color="#2563eb"
  progress={85}
  change="Rolling Rate"
/>
      </section>

      <section className="status-row">
        <StatusCard icon={CheckCircle} title="Production Status" value="Normal" sub="All parameters are normal" color="#16a34a" />
        <StatusCard icon={Target} title="Top SGF Family" value={topSgf.name || "N/A"} sub={`${fmt(topSgf.value, 0)} MT (${percent(topSgf.value, totalTonnage)}%)`} color="#ff5a00" />
        <StatusCard icon={Package} title="Top Slab Type" value={topSlab.name || "N/A"} sub={`${fmt(topSlab.value, 0)} MT (${percent(topSlab.value, totalTonnage)}%)`} color="#0b63ce" />
        <StatusCard icon={Flame} title="Top Furnace" value={topFurnace.name || "N/A"} sub={`${fmt(topFurnace.value, 0)} MT (${percent(topFurnace.value, totalTonnage)}%)`} color="#ff5a00" />
        <button
       className="alerts-btn"
       onClick={()=>setPage("Alarm List")}
       >
        View All Alerts
        </button>
        </section>
        <div className="table-card" style={{ marginBottom: "20px" }}>
  
  <p style={{ lineHeight: "1.7", color: "#374151" }}>
  </p>
</div>
      <FilterPanel
      filters={filters}
      setFilters={setFilters}
      options={options}
    />

      <section className="chart-grid-three">
        <ChartCard title="PRODUCTION TONNAGE TREND (MT)" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="tonnage" fill="#ff6b0022" stroke="#ff6b00" />
              <Line type="monotone" dataKey="tonnage" stroke="#ff5a00" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="HOURLY TPH TREND - LATEST DATE" isEmpty={hourlyTPH.length === 0}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={hourlyTPH}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
      <XAxis dataKey="hour" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="tph"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 3 }}
      />
    </LineChart>
  </ResponsiveContainer>
</ChartCard>

        <ChartCard title="COIL COUNT TREND (COILS)" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="coils" stroke="#0b63ce" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="QUALITY FACTOR TREND (%)" isEmpty={daily.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="yield" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>


      <section className="chart-grid-four">
  <ChartCard title="SGF FAMILY WISE TONNAGE (MT)" isEmpty={sgfData.length === 0}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sgfData} margin={{ top: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<BarChartTooltip total={sumOf(sgfData, "value")} unit="MT" />} />
        <Bar dataKey="value" fill="#ff5a00" radius={[8, 8, 0, 0]}>
          <LabelList dataKey="value" content={renderBarTopLabel(sumOf(sgfData, "value"))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>

  <ChartCard title="SLAB TYPE WISE TONNAGE (MT)" isEmpty={slabData.length === 0}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={slabData} margin={{ top: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<BarChartTooltip total={sumOf(slabData, "value")} unit="MT" />} />
        <Bar dataKey="value" fill="#0b63ce" radius={[8, 8, 0, 0]}>
          <LabelList dataKey="value" content={renderBarTopLabel(sumOf(slabData, "value"))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>

  <ChartCard title="THICKNESS DISTRIBUTION" isEmpty={thicknessData.length === 0}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={thicknessData} margin={{ top: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
        <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip content={<BarChartTooltip total={sumOf(thicknessData, "value")} />} />
        <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]}>
          <LabelList dataKey="value" content={renderBarTopLabel(sumOf(thicknessData, "value"))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>

  <ChartCard title="WIDTH DISTRIBUTION" isEmpty={widthData.length === 0}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={widthData} margin={{ top: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
        <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip content={<BarChartTooltip total={sumOf(widthData, "value")} />} />
        <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]}>
          <LabelList dataKey="value" content={renderBarTopLabel(sumOf(widthData, "value"))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
</section>
     <section className= "bottom-section">
        <QuickAccess setPage={setPage} />
        <DataSummary fileName={options?.fileName||"Uploaded File"}
        records={data.length}
         />
      </section>
      <AIAssistant data={data} />
    </>
  );
}