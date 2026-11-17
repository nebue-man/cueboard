import { db } from "@/lib/db";

export async function generateInvoice(params: {
  clubId:         string;
  periodStart:    string;
  periodEnd:      string;
  commissionRate: number;
}) {
  const { clubId, periodStart, periodEnd, commissionRate } = params;

  const bookings = await db.booking.findMany({
    where: {
      clubId,
      date: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
      status: "CONFIRMED",
    },
    include: {
      bookingTables: { include: { table: true } },
      slotDuration: true,
    },
  });

  const bookingCount = bookings.length;
  const grossRevenue = bookings.reduce((sum, b) => {
    const tableTotal = b.bookingTables.reduce((s, bt) => s + bt.table.pricePerSlot, 0);
    return sum + tableTotal;
  }, 0);
  const totalAmount = grossRevenue * commissionRate;

  return db.invoice.create({
    data: {
      clubId,
      periodStart: new Date(periodStart),
      periodEnd:   new Date(periodEnd),
      bookingCount,
      commissionRate,
      totalAmount,
      status: "PENDING",
    },
  });
}

export async function getInvoicesForClub(clubId: string) {
  return db.invoice.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
}
