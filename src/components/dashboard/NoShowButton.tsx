"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NoShowButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markNoShow() {
    setLoading(true);
    await fetch(`/api/dashboard/bookings/${bookingId}/no-show`, { method: "PATCH" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={markNoShow}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "…" : "No-show"}
    </button>
  );
}
