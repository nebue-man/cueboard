/** @jest-environment node */
import { db } from "@/lib/db";
import { generateInvoice, getInvoicesForClub } from "./invoices";

describe("invoices data layer", () => {
  let clubId: string;

  beforeAll(async () => {
    const club = await db.club.findFirst();
    if (!club) throw new Error("No seed clubs");
    clubId = club.id;
  });

  afterAll(() => db.$disconnect());

  it("generates an invoice with correct booking count", async () => {
    const invoice = await generateInvoice({
      clubId,
      periodStart:    "2030-01-01",
      periodEnd:      "2030-01-31",
      commissionRate: 0.1,
    });

    expect(invoice.clubId).toBe(clubId);
    expect(invoice.commissionRate).toBe(0.1);
    expect(invoice.status).toBe("PENDING");
    expect(typeof invoice.bookingCount).toBe("number");
    expect(typeof invoice.totalAmount).toBe("number");
  });

  it("getInvoicesForClub returns invoices for the club", async () => {
    const invoices = await getInvoicesForClub(clubId);
    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.every((i) => i.clubId === clubId)).toBe(true);
  });
});
