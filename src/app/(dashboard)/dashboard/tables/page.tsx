import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";
import { ToggleActiveButton } from "@/components/dashboard/ToggleActiveButton";
import { AddTableForm } from "@/components/dashboard/AddTableForm";

export default async function TablesPage() {
  const session = await auth();
  const tables  = await db.table.findMany({
    where: { clubId: session!.user.clubId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Tables</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Name", "Type", "Price / slot", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{table.name}</td>
                <td className="px-4 py-3"><TableTypeBadge type={table.type} /></td>
                <td className="px-4 py-3">LKR {table.pricePerSlot.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${table.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {table.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton id={table.id} isActive={table.isActive} endpoint="tables" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <h2 className="mb-4 font-serif text-lg font-semibold text-brand">Add a table</h2>
        <AddTableForm />
      </div>
    </div>
  );
}
