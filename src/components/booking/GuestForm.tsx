"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const GuestSchema = z.object({
  guestName:   z.string().min(2, "Name must be at least 2 characters"),
  guestPhone:  z.string().min(7, "Enter a valid phone number"),
  playerCount: z.number().int().min(1).max(20),
});

type GuestFields = z.infer<typeof GuestSchema>;

type Props = {
  clubId:         string;
  slotDurationId: string;
  tableIds:       string[];
  date:           string;
  startTime:      string;
  onBack:         () => void;
};

export function GuestForm({ clubId, slotDurationId, tableIds, date, startTime, onBack }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GuestFields>({
    resolver: zodResolver(GuestSchema),
    defaultValues: { playerCount: 1 },
  });

  async function onSubmit(data: GuestFields) {
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId, slotDurationId, tableIds, date, startTime, ...data }),
    });

    if (res.status === 409) {
      setError("One or more tables were just booked. Please go back and try again.");
      return;
    }
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    const { bookingId } = await res.json();
    router.push(`/bookings/${bookingId}/confirmation`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Your details</h3>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register("guestName")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Your full name"
        />
        {errors.guestName && <p className="mt-1 text-xs text-red-600">{errors.guestName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
        <input
          {...register("guestPhone")}
          type="tel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="+94 77 123 4567"
        />
        {errors.guestPhone && <p className="mt-1 text-xs text-red-600">{errors.guestPhone.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Number of players</label>
        <input
          {...register("playerCount", { valueAsNumber: true })}
          type="number"
          min={1}
          max={20}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {errors.playerCount && <p className="mt-1 text-xs text-red-600">{errors.playerCount.message}</p>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50">
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60 hover:bg-brand-light"
        >
          {isSubmitting ? "Confirming…" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}
