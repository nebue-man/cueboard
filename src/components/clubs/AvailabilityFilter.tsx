"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { TableType } from "@/types";

const TABLE_TYPES: { value: TableType | ""; label: string }[] = [
  { value: "",          label: "All types" },
  { value: "POOL",      label: "Pool" },
  { value: "SNOOKER",   label: "Snooker" },
  { value: "BILLIARDS", label: "Billiards" },
  { value: "CAROM",     label: "Carom" },
];

export function AvailabilityFilter() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/clubs?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={params.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {TABLE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <input
        type="date"
        defaultValue={params.get("date") ?? ""}
        onChange={(e) => update("date", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
