/**
 * @jest-environment node
 */
import { getClubs, getClubBySlug, searchClubs } from "./clubs";

describe("clubs data layer", () => {
  it("getClubs returns all clubs with tables", async () => {
    const clubs = await getClubs();
    expect(clubs.length).toBeGreaterThanOrEqual(2);
    expect(clubs[0].tables).toBeDefined();
    expect(clubs[0].slotDurations).toBeDefined();
  });

  it("getClubBySlug returns a club for a valid slug", async () => {
    const club = await getClubBySlug("break-point-colombo");
    expect(club).not.toBeNull();
    expect(club?.name).toBe("Break Point Colombo");
    expect(club?.products).toBeDefined();
  });

  it("getClubBySlug returns null for unknown slug", async () => {
    const club = await getClubBySlug("does-not-exist");
    expect(club).toBeNull();
  });

  it("searchClubs filters by tableType", async () => {
    const clubs = await searchClubs({ tableType: "SNOOKER" });
    for (const club of clubs) {
      const hasSnooker = club.tables.some((t) => t.type === "SNOOKER");
      expect(hasSnooker).toBe(true);
    }
  });
});
