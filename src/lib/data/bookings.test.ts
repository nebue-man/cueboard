/**
 * @jest-environment node
 */
import { db } from "@/lib/db";
import { createBooking, getBookingById, getUnavailableTableIds } from "./bookings";

describe("bookings data layer", () => {
  let clubId: string;
  let slotDurationId: string;
  let tableId: string;

  beforeAll(async () => {
    const club = await db.club.findFirst({ include: { tables: true, slotDurations: true } });
    if (!club) throw new Error("No seed clubs found");
    clubId = club.id;
    slotDurationId = club.slotDurations[0].id;
    tableId = club.tables[0].id;
  });

  afterAll(() => db.$disconnect());

  it("creates a booking and returns it with tables", async () => {
    const booking = await createBooking({
      clubId,
      slotDurationId,
      tableIds: [tableId],
      guestName: "Test User",
      guestPhone: "+94771234567",
      playerCount: 2,
      date: "2030-01-15",
      startTime: "14:00",
    });

    expect(booking.id).toBeDefined();
    expect(booking.status).toBe("CONFIRMED");
    expect(booking.bookingTables).toHaveLength(1);
  });

  it("getBookingById returns a booking", async () => {
    const booking = await createBooking({
      clubId,
      slotDurationId,
      tableIds: [tableId],
      guestName: "Another User",
      guestPhone: "+94779876543",
      playerCount: 1,
      date: "2030-01-16",
      startTime: "10:00",
    });

    const fetched = await getBookingById(booking.id);
    expect(fetched?.guestName).toBe("Another User");
  });

  it("getUnavailableTableIds returns occupied table ids", async () => {
    const unavailable = await getUnavailableTableIds({
      clubId,
      date: "2030-01-15",
      startTime: "14:00",
      slotDurationId,
    });
    expect(unavailable).toContain(tableId);
  });
});
