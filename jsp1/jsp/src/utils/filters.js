export function applyFilters(data, filters) {
  return data.filter((row) => {
    const rowDate = new Date(row.production_date);

    let datePass = true;
    let timePass = true;

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      datePass = datePass && rowDate >= start;
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      datePass = datePass && rowDate <= end;
    }

    if (filters.startTime || filters.endTime) {
      const rowMinutes = rowDate.getHours() * 60 + rowDate.getMinutes();

      if (filters.startTime) {
        const [h, m] = filters.startTime.split(":").map(Number);
        timePass = timePass && rowMinutes >= h * 60 + m;
      }

      if (filters.endTime) {
        const [h, m] = filters.endTime.split(":").map(Number);
        timePass = timePass && rowMinutes <= h * 60 + m;
      }
    }

    return (
      datePass &&
      timePass &&
      (filters.shift === "All Shifts" || row.shift === filters.shift) &&
      (filters.grade === "All" || row.steel_grade_code === filters.grade) &&
      (filters.sgf === "All" || row.steel_grade_family === filters.sgf) &&
      (filters.slab === "All" || row.slab_type === filters.slab) &&
      (filters.customer === "All" || row.customer_name === filters.customer)
    );
  });
}