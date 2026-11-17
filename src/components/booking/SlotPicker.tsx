"use client";
import { useState } from "react";
import type { SlotDuration } from "@/types";

type Props = {
  slotDurations: SlotDuration[];
  onConfirm: (params: { date: string; startTime: string; slotDurationId: string }) => void;
};

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
});

export function SlotPicker({ slotDurations, onConfirm }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]             = useState("");
  const [startTime, setStartTime]   = useState("");
  const [durationId, setDurationId] = useState(slotDurations[0]?.id ?? "");

  const canContinue = date && startTime && durationId;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Choose a time</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Duration</label>
        <select
          value={durationId}
          onChange={(e) => setDurationId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {slotDurations.map((sd) => (
            <option key={sd.id} value={sd.id}>{sd.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Start time</label>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Select a time</option>
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <button
        disabled={!canContinue}
        onClick={() => onConfirm({ date, startTime, slotDurationId: durationId })}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40 hover:bg-brand-light"
      >
        See available tables
      </button>
    </div>
  );
}
