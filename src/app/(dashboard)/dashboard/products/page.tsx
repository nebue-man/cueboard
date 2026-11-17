import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ToggleActiveButton } from "@/components/dashboard/ToggleActiveButton";

export default async function ProductsPage() {
  const session  = await auth();
  const products = await db.product.findMany({
    where: { clubId: session!.user.clubId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Products & Services</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Name", "Type", "Price", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{p.type.toLowerCase()}</td>
                <td className="px-4 py-3">{p.price ? `LKR ${p.price.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton id={p.id} isActive={p.isActive} endpoint="products" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No products yet.</p>
        )}
      </div>
    </div>
  );
}
