import { NextRequest, NextResponse } from "next/server";
import { CreateBookingSchema } from "@/lib/validations";
import { createBooking, getUnavailableTableIds } from "@/lib/data/bookings";
import { sendBookingNotification } from "@/lib/whatsapp";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { clubId, slotDurationId, tableIds, date, startTime } = parsed.data;

  const unavailable = await getUnavailableTableIds({ clubId, date, startTime, slotDurationId });
  const conflict = tableIds.some((id) => unavailable.includes(id));
  if (conflict) {
    return NextResponse.json(
      { error: "One or more selected tables are no longer available. Please try different times." },
      { status: 409 },
    );
  }

  const booking = await createBooking(parsed.data);

  // Fire-and-forget WhatsApp notification to the club owner
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { name: true, whatsappId: true },
  });

  if (club?.whatsappId) {
    const tableNames = booking.bookingTables.map((bt) => bt.table.name);
    sendBookingNotification({
      toPhone:    club.whatsappId,
      clubName:   club.name,
      guestName:  booking.guestName,
      date,
      startTime,
      tableNames,
    }).catch(console.error);
  }

  return NextResponse.json({ bookingId: booking.id }, { status: 201 });
}
