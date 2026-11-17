import { auth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const { todayBookings, totalBookings, clubName } = await getDashboardOverview(session!.user.clubId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">{clubName}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Bookings today</p>
          <p className="mt-2 font-serif text-4xl font-bold text-brand">{todayBookings}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total bookings</p>
          <p className="mt-2 font-serif text-4xl font-bold text-brand">{totalBookings}</p>
        </div>
      </div>
    </div>
  );
}
