"use client";
import { useEffect, useState } from "react";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";
import type { Table } from "@/types";

type Props = {
  clubId:         string;
  date:           string;
  startTime:      string;
  slotDurationId: string;
  tables:         Table[];
  onConfirm:      (tableIds: string[]) => void;
  onBack:         () => void;
};

export function TableSelector({ clubId, date, startTime, slotDurationId, tables, onConfirm, onBack }: Props) {
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [selected, setSelected]       = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ clubId, date, startTime, slotDurationId });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => setUnavailable(data.unavailableTableIds ?? []))
      .finally(() => setLoading(false));
  }, [clubId, date, startTime, slotDurationId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (loading) return <p className="text-sm text-gray-500">Checking availability…</p>;

  const activeTables = tables.filter((t) => t.isActive);

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Select tables</h3>
      <p className="text-sm text-gray-500">{date} · {startTime} · {activeTables.length} tables</p>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {activeTables.map((table) => {
          const isUnavailable = unavailable.includes(table.id);
          const isSelected    = selected.includes(table.id);
          return (
            <button
              key={table.id}
              disabled={isUnavailable}
              onClick={() => toggle(table.id)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                isUnavailable ? "cursor-not-allowed opacity-40" :
                isSelected    ? "bg-brand/10 ring-inset ring-1 ring-brand" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <TableTypeBadge type={table.type} />
                <span className="text-sm font-medium">{table.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">LKR {table.pricePerSlot.toLocaleString()}</p>
                {isUnavailable && <p className="text-xs text-red-500">Unavailable</p>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50">
          Back
        </button>
        <button
          disabled={selected.length === 0}
          onClick={() => onConfirm(selected)}
          className="flex-1 rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40 hover:bg-brand-light"
        >
          Continue ({selected.length} table{selected.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
