import * as XLSX from "xlsx";

export function makeSampleData() {
  const rows = [];
  const grades = ["JCV6P", "JC10A", "JG25B", "DG35N", "JG35R"];
  const sgf = ["API", "IS", "HSLA", "CR"];
  const slabs = ["FT", "HR", "CR"];
  const customers = ["SAIL", "TATA STEEL", "JSPL INTERNAL", "NALWA"];
  const furnaces = ["Furnace 1", "Furnace 2", "Furnace 3", "Furnace 4"];

  for (let i = 0; i < 1200; i++) {
    const d = new Date(2026, 5, 13 + (i % 7), 6 + (i % 18), 0);

    rows.push({
      production_date: d,
      coil_id: `C${260000 + i}`,
      steel_grade_code: grades[i % grades.length],
      steel_grade_family: sgf[i % sgf.length],
      slab_type: slabs[i % slabs.length],
      customer_name: customers[i % customers.length],
      furnace: furnaces[i % furnaces.length],
      thickness: [2.3, 4, 6, 8, 10, 12][i % 6],
      width: [950, 1100, 1250, 1350, 1500, 1600][i % 6],
      weight: 30 + (i % 25),
      yield_percent: 97 + (i % 20) / 10,
      status: i % 80 === 0 ? "FAIL" : "PASS",
      delay_minutes: i % 15 === 0 ? 25 : 0,
      shift:
        d.getHours() >= 6 && d.getHours() < 14
          ? "A"
          : d.getHours() >= 14 && d.getHours() < 22
          ? "B"
          : "C"
    });
  }

  return rows;
}

export function toNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;

  return (
    Number(
      String(value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    ) || 0
  );
}

export function excelDateToJSDate(serial) {
  if (typeof serial !== "number") return null;

  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);

  const fractionalDay = serial - Math.floor(serial);
  date.setSeconds(date.getSeconds() + Math.floor(86400 * fractionalDay));

  return date;
}

export function parseProductionDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return excelDateToJSDate(value);

  const text = String(value).trim();

  const ddmmyyyy = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]) - 1;
    const year = Number(ddmmyyyy[3]);
    const hour = Number(ddmmyyyy[4] || 0);
    const minute = Number(ddmmyyyy[5] || 0);
    const second = Number(ddmmyyyy[6] || 0);

    return new Date(year, month, day, hour, minute, second);
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeFurnace(value) {
  if (value === undefined || value === null || value === "") return "Unknown";
  const text = String(value).trim();

  if (text.toLowerCase().includes("furnace")) return text;

  return `Furnace ${text}`;
}

export function mapRows(json) {
  return json
    .filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      )
    )
    .map((row, index) => {
      const get = (...keys) =>
        keys
          .map((key) => row[key])
          .find(
            (value) =>
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
          );

      const rawDate = get(
        "Product Time",
        "Production Time",
        "production_date",
        "Production_Date",
        "Date",
        "date"
      );

      const productionDate =
        parseProductionDate(rawDate) || new Date(2026, 5, 13);

      const weightKg = toNumber(
        get(
          "Coil Wt Act[kg]",
          "Coil Wt Act [kg]",
          "weight_kg",
          "Weight_Kg",
          "Coil Wt"
        )
      );

      const weightMT = toNumber(
        get("weight", "Weight_Tons", "Weight", "Tonnage", "Tonnage_MT")
      );

      return {
        production_date: productionDate,
        coil_id: get("Coil ID", "coil_id", "Coil_ID") || `C${index + 1}`,
        steel_grade_code: String(
          get("SGC", "steel_grade_code", "Grade_Code") || "Unknown"
        ),
        steel_grade_family: String(
          get("SGF", "steel_grade_family", "Grade_Family") || "Unknown"
        ),
        slab_type: String(
          get("Slab Type", "slab_type", "Product_Type") || "Unknown"
        ),
        customer_name: String(
          get("Cust Name", "customer_name", "Customer") || "Unknown"
        ),
        furnace: normalizeFurnace(get("Fce", "furnace", "Furnace")),
        thickness: toNumber(get("Thk Targ[mm]", "thickness", "Thickness")),
        width: toNumber(get("FM Wid Targ[mm]", "width", "Width")),
        cb_use: toNumber(get("CBUse Act", "cb_use", "CBUse")),
        eh_use: toNumber(get("EHUse Act", "eh_use", "EHUse")),
        yield_percent: toNumber(get("Yield[%]", "yield_percent", "Yield")),
        weight: weightKg > 0 ? weightKg / 1000 : weightMT,
        status: String(get("Status", "status") || "PASS"),
        delay_minutes: toNumber(
          get("Delay Minutes", "delay_minutes", "delay")
        ),
        shift:
          productionDate.getHours() >= 6 && productionDate.getHours() < 14
            ? "A"
            : productionDate.getHours() >= 14 &&
              productionDate.getHours() < 22
            ? "B"
            : "C"
      };
    });
}

export async function readExcelFile(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  let json = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false
  });

  if (json.length && !Object.prototype.hasOwnProperty.call(json[0], "Product Time")) {
    json = XLSX.utils.sheet_to_json(sheet, {
      range: 1,
      defval: "",
      raw: false
    });
  }

  return mapRows(json);
}