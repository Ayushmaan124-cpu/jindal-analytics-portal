import React from "react";

export default function FilterPanel({ filters, setFilters, options }) {
  return (
    <div className="filters">
      <div className="filter-grid">
        <label>
          From Date
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                startDate: e.target.value
              })
            }
          />
        </label>



        <label>
          To Date
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                endDate: e.target.value
              })
            }
          />
        </label>

        <label>
          Start Time
          <input
            type="time"
            value={filters.startTime}
            onChange={(e) =>
              setFilters({
                ...filters,
                startTime: e.target.value
              })
            }
          />
        </label>

        <label>
          End Time
          <input
            type="time"
            value={filters.endTime}
            onChange={(e) =>
              setFilters({
                ...filters,
                endTime: e.target.value
              })
            }
          />
        </label>

        <label>
          Steel Grade Code
          <select
            value={filters.grade}
            onChange={(e) =>
              setFilters({
                ...filters,
                grade: e.target.value
              })
            }
          >
            <option>All</option>
            {options.grades.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>

        <label>
          Steel Grade Family
          <select
            value={filters.sgf}
            onChange={(e) =>
              setFilters({
                ...filters,
                sgf: e.target.value
              })
            }
          >
            <option>All</option>
            {options.sgfs.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>

        <label>
          Customer
          <select
            value={filters.customer}
            onChange={(e) =>
              setFilters({
                ...filters,
                customer: e.target.value
              })
            }
          >
            <option>All</option>
            {options.customers.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>

        <label>
          Shift
          <select
            value={filters.shift}
            onChange={(e) =>
              setFilters({
                ...filters,
                shift: e.target.value
              })
            }
          >
            <option>All Shifts</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </label>
      </div>
<div className="filter-actions">
  <button
    className="secondary-btn"
    onClick={() =>
      setFilters({
        startDate: "",
        endDate: "",
        grade: "All",
        sgf: "All",
        customer: "All",
        slab: "All",
        shift: "All Shifts"
      })
    }
  >
    Clear Filters
  </button>
</div>
    </div>
  );
}