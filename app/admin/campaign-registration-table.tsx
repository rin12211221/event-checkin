"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { CampaignRegistrant } from "@/lib/upswell";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CampaignRegistrationTable({
  registrations,
}: {
  registrations: CampaignRegistrant[];
}) {
  const [query, setQuery] = useState("");
  const [ambassador, setAmbassador] = useState("all");

  const ambassadors = useMemo(
    () =>
      [...new Set(registrations.map((row) => row.ambassadorCode))].sort(),
    [registrations],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return registrations.filter((row) => {
      const matchesAmbassador =
        ambassador === "all" || row.ambassadorCode === ambassador;
      const haystack = `${row.name} ${row.phone ?? ""} ${row.email ?? ""} ${row.ambassadorName} ${row.ambassadorCode}`.toLowerCase();
      return matchesAmbassador && (!needle || haystack.includes(needle));
    });
  }, [registrations, query, ambassador]);

  function exportCsv() {
    const body = registrations.map((row) => [
      row.name,
      row.phone ?? "",
      row.email ?? "",
      row.ambassadorName,
      row.ambassadorCode,
      row.registeredAt ?? "",
    ]);
    const csv = [
      ["Name", "Phone", "Email", "Ambassador / Club", "Ambassador Code", "Registered At"],
      ...body,
    ]
      .map((line) =>
        line
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "upswell-campaign-registrations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, phone, or ambassador"
          />
        </div>
        <select
          className="campaign-filter-select"
          value={ambassador}
          onChange={(event) => setAmbassador(event.target.value)}
        >
          <option value="all">All ambassador links</option>
          {ambassadors.map((code) => {
            const match = registrations.find((row) => row.ambassadorCode === code);
            return (
              <option value={code} key={code}>
                {match?.ambassadorName ?? "Ambassador"} · {code}
              </option>
            );
          })}
        </select>
        <button
          type="button"
          className="button button-secondary button-small"
          onClick={exportCsv}
        >
          <Download size={16} /> CSV
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Ambassador / Club link</th>
              <th>Registered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-table">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.ambassadorCode}:${row.userId}`}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.phone ?? row.email ?? row.userId}</span>
                  </td>
                  <td>
                    <strong>{row.ambassadorName}</strong>
                    <span>{row.ambassadorCode}</span>
                  </td>
                  <td>{formatDate(row.registeredAt)}</td>
                  <td>
                    <span className="status status-waiting">Registered</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
