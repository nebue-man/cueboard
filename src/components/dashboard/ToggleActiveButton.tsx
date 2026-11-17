"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; isActive: boolean; endpoint: "tables" | "products" };

export function ToggleActiveButton({ id, isActive, endpoint }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/dashboard/${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
