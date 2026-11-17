import { db } from "@/lib/db";
import type { CreateBookingInput } from "@/lib/validations";

export async function createBooking(input: CreateBookingInput) {
  return db.booking.create({
    data: {
      clubId:         input.clubId,
      slotDurationId: input.slotDurationId,
      guestName:      input.guestName,
      guestPhone:     input.guestPhone,
      playerCount:    input.playerCount,
      date:           new Date(input.date),
      startTime:      input.startTime,
      status:         "CONFIRMED",
      bookingTables: {
        create: input.tableIds.map((tableId) => ({ tableId })),
      },
    },
    include: { bookingTables: { include: { table: true } }, slotDuration: true, club: true },
  });
}

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: { bookingTables: { include: { table: true } }, slotDuration: true, club: true },
  });
}

export async function getUnavailableTableIds(params: {
  clubId:         string;
  date:           string;
  startTime:      string;
  slotDurationId: string;
}) {
  const { clubId, date, startTime, slotDurationId } = params;
  const slotDuration = await db.slotDuration.findUnique({ where: { id: slotDurationId } });
  if (!slotDuration) return [];

  const bookingDate      = new Date(date);
  const [startH, startM] = startTime.split(":").map(Number);
  const startMinutes     = startH * 60 + startM;
  const endMinutes       = startMinutes + slotDuration.minutes;

  const conflicts = await db.booking.findMany({
    where: { clubId, date: bookingDate, status: "CONFIRMED" },
    include: { slotDuration: true, bookingTables: true },
  });

  const unavailable = new Set<string>();
  for (const booking of conflicts) {
    const [bH, bM] = booking.startTime.split(":").map(Number);
    const bStart   = bH * 60 + bM;
    const bEnd     = bStart + booking.slotDuration.minutes;
    if (startMinutes < bEnd && endMinutes > bStart) {
      booking.bookingTables.forEach((bt) => unavailable.add(bt.tableId));
    }
  }

  return [...unavailable];
}

export async function getClubBookings(clubId: string) {
  return db.booking.findMany({
    where: { clubId },
    include: { bookingTables: { include: { table: true } }, slotDuration: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });
}
