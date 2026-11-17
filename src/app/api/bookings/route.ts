import { NextRequest, NextResponse } from "next/server";
import { CreateBookingSchema } from "@/lib/validations";
import { createBooking, getUnavailableTableIds } from "@/lib/data/bookings";

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
  return NextResponse.json({ bookingId: booking.id }, { status: 201 });
}
