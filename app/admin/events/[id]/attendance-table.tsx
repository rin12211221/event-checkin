"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  name: string;
  phone: string;
  club: string | null;
  source: "club_link" | "walk_in" | "direct";
  createdAt: string;
  checkedInAt: string | null;
};

export function AttendanceTable({ registrations }: { registrations: Row[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "waiting" | "walkin">("all");

  const rows = useMemo(() => registrations.filter((row) => {
    const matchesQuery = `${row.name} ${row.phone} ${row.club ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "in" && row.checkedInAt) || (filter === "waiting" && !row.checkedInAt) || (filter === "walkin" && row.source === "walk_in");
    return matchesQuery && matchesFilter;
  }), [registrations, query, filter]);

  function exportCsv() {
    const cells = registrations.map((row) => [row.name, row.phone, row.club ?? "", row.source, row.createdAt, row.checkedInAt ?? ""]);
    const csv = [["Name", "Phone", "Club", "Source", "Registered At", "Checked In At"], ...cells]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "event-attendance.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, or club" /></div>
        <div className="filter-tabs">
          {([['all','All'],['in','Checked in'],['waiting','Not arrived'],['walkin','Walk-ins']] as const).map(([value,label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <button className="button button-secondary button-small" onClick={exportCsv}><Download size={16} /> CSV</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Person</th><th>Club</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4} className="empty-table">No matching registrations.</td></tr> : rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.name}</strong><span>{row.phone}</span></td>
                <td>{row.club ?? "—"}</td>
                <td>{row.source === "walk_in" ? "Walk-in" : row.source === "club_link" ? "Club link" : "Direct"}</td>
                <td>{row.checkedInAt ? <span className="status status-in">Checked in</span> : <span className="status status-waiting">Not arrived</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
