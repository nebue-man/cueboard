"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTableSchema, CreateTableInput } from "@/lib/validations";

export function AddTableForm() {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateTableInput>({
    resolver: zodResolver(CreateTableSchema),
  });

  async function onSubmit(data: CreateTableInput) {
    await fetch("/api/dashboard/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-3">
      <input {...register("name")} placeholder="Table name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      <select {...register("type")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none">
        <option value="POOL">Pool</option>
        <option value="SNOOKER">Snooker</option>
        <option value="BILLIARDS">Billiards</option>
        <option value="CAROM">Carom</option>
      </select>
      <input {...register("pricePerSlot", { valueAsNumber: true })} type="number" placeholder="Price per slot (LKR)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60">
        {isSubmitting ? "Adding…" : "Add table"}
      </button>
    </form>
  );
}
