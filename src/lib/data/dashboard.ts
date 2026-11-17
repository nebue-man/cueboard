import { db } from "@/lib/db";

export async function getDashboardOverview(clubId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, totalBookings, club] = await Promise.all([
    db.booking.count({
      where: { clubId, date: { gte: today, lt: tomorrow }, status: "CONFIRMED" },
    }),
    db.booking.count({ where: { clubId } }),
    db.club.findUnique({ where: { id: clubId }, select: { name: true } }),
  ]);

  return { todayBookings, totalBookings, clubName: club?.name ?? "" };
}
