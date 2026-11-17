import { auth } from "@/lib/auth";
import { getInvoicesForClub } from "@/lib/data/invoices";
import { GenerateInvoiceForm } from "@/components/dashboard/GenerateInvoiceForm";

export default async function InvoicesPage() {
  const session  = await auth();
  const invoices = await getInvoicesForClub(session!.user.clubId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Invoices</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Period", "Bookings", "Commission", "Amount", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {new Date(inv.periodStart).toLocaleDateString("en-LK")} —{" "}
                  {new Date(inv.periodEnd).toLocaleDateString("en-LK")}
                </td>
                <td className="px-4 py-3">{inv.bookingCount}</td>
                <td className="px-4 py-3">{(inv.commissionRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 font-semibold">LKR {inv.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.status === "PAID"    ? "bg-green-100 text-green-800" :
                    inv.status === "SENT"    ? "bg-blue-100 text-blue-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No invoices yet.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-serif text-lg font-semibold text-brand">Generate invoice</h2>
        <GenerateInvoiceForm />
      </div>
    </div>
  );
}
