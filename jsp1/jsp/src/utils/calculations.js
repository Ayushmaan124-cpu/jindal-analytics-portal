export function fmt(n, dec = 0) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: dec,
    minimumFractionDigits: dec
  });
}
export function isValidCategory(value) {
  const v = String(value || "").trim().toLowerCase();

  const badValues = [
    "",
    "na",
    "n/a",
    "undefined",
    "null",
    "sgf",
    "slab type",
    "furnace",
    "furnace fce",
    "fce"
  ];

  return !badValues.includes(v);
}

export function sumBy(data, key) {
  const badValues = [
    "",
    "N/A",
    "NA",
    "SGF",
    "Slab Type",
    "Furnace",
    "Furnace Fce",
    "Fce",
    "undefined",
    "null"
  ];

  const map = {};

  data.forEach((row) => {
    const name = String(row[key] || "").trim();

    if (!name) return;
    if (badValues.includes(name)) return;

    const value = Number(row.weight || row.tonnage || row.value || 0);

    if (!map[name]) {
      map[name] = 0;
    }

    map[name] += value;
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(0))
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function countBy(data, key) {
  const map = {};

  data.forEach((row) => {
    const name = row[key] || "Unknown";
    map[name] = (map[name] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function percent(part, total) {
  return total ? ((part / total) * 100).toFixed(1) : "0.0";
}