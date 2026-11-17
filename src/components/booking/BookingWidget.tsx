"use client";
import { useState } from "react";
import { SlotPicker } from "./SlotPicker";
import { TableSelector } from "./TableSelector";
import { GuestForm } from "./GuestForm";
import type { SlotDuration, Table } from "@/types";

type Step = "slot" | "tables" | "guest";
type SlotSelection = { date: string; startTime: string; slotDurationId: string };

type Props = {
  clubId:        string;
  slotDurations: SlotDuration[];
  tables:        Table[];
};

export function BookingWidget({ clubId, slotDurations, tables }: Props) {
  const [step, setStep]         = useState<Step>("slot");
  const [slot, setSlot]         = useState<SlotSelection | null>(null);
  const [tableIds, setTableIds] = useState<string[]>([]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        {(["slot", "tables", "guest"] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              step === s          ? "bg-brand" :
              (step === "tables" && s === "slot") || step === "guest" ? "bg-brand/40" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === "slot" && (
        <SlotPicker
          slotDurations={slotDurations}
          onConfirm={(s) => { setSlot(s); setStep("tables"); }}
        />
      )}

      {step === "tables" && slot && (
        <TableSelector
          clubId={clubId}
          date={slot.date}
          startTime={slot.startTime}
          slotDurationId={slot.slotDurationId}
          tables={tables}
          onConfirm={(ids) => { setTableIds(ids); setStep("guest"); }}
          onBack={() => setStep("slot")}
        />
      )}

      {step === "guest" && slot && (
        <GuestForm
          clubId={clubId}
          slotDurationId={slot.slotDurationId}
          tableIds={tableIds}
          date={slot.date}
          startTime={slot.startTime}
          onBack={() => setStep("tables")}
        />
      )}
    </div>
  );
}
