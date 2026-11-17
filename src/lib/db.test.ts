/**
 * @jest-environment node
 */

import { db } from "./db";

describe("database", () => {
  afterAll(() => db.$disconnect());

  it("can query clubs table", async () => {
    const clubs = await db.club.findMany({ take: 5 });
    expect(Array.isArray(clubs)).toBe(true);
  });

  it("seed data has at least two clubs", async () => {
    const count = await db.club.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("each club has at least one table", async () => {
    const clubs = await db.club.findMany({ include: { tables: true }, take: 2 });
    for (const club of clubs) {
      expect(club.tables.length).toBeGreaterThan(0);
    }
  });
});
