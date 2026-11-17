import { db } from "@/lib/db";
import { TableType } from "@/types";

const clubWithDetails = {
  tables: true,
  slotDurations: true,
  products: { where: { isActive: true } },
} as const;

export async function getClubs() {
  return db.club.findMany({
    include: clubWithDetails,
    orderBy: { name: "asc" },
  });
}

export async function getClubBySlug(slug: string) {
  return db.club.findUnique({
    where: { slug },
    include: clubWithDetails,
  });
}

export async function searchClubs(filters: {
  tableType?: TableType;
  date?: string;
  startTime?: string;
}) {
  const { tableType, date, startTime } = filters;

  const clubs = await db.club.findMany({
    include: clubWithDetails,
    where: tableType
      ? { tables: { some: { type: tableType, isActive: true } } }
      : undefined,
    orderBy: { name: "asc" },
  });

  if (!date || !startTime) return clubs;

  // Availability conflict check deferred to Slice C
  return clubs;
}
