"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateInvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/dashboard/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodStart: form.get("periodStart"),
        periodEnd:   form.get("periodEnd"),
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Period start</label>
        <input name="periodStart" type="date" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Period end</label>
        <input name="periodEnd" type="date" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      </div>
      <button type="submit" disabled={loading} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60">
        {loading ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}
