import { auth } from "@/lib/auth";
import { getClubBookings } from "@/lib/data/bookings";
import { NoShowButton } from "@/components/dashboard/NoShowButton";

export default async function BookingsPage() {
  const session  = await auth();
  const bookings = await getClubBookings(session!.user.clubId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Bookings</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Date", "Time", "Guest", "Players", "Tables", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(booking.date).toLocaleDateString("en-LK")}</td>
                <td className="px-4 py-3">{booking.startTime}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{booking.guestName}</p>
                  <p className="text-gray-400">{booking.guestPhone}</p>
                </td>
                <td className="px-4 py-3">{booking.playerCount}</td>
                <td className="px-4 py-3">{booking.bookingTables.map((bt) => bt.table.name).join(", ")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                    booking.status === "NO_SHOW"   ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {booking.status === "CONFIRMED" && (
                    <NoShowButton bookingId={booking.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
