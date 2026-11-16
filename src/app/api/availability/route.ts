import { NextRequest, NextResponse } from "next/server";
import { getUnavailableTableIds } from "@/lib/data/bookings";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId         = searchParams.get("clubId");
  const date           = searchParams.get("date");
  const startTime      = searchParams.get("startTime");
  const slotDurationId = searchParams.get("slotDurationId");

  if (!clubId || !date || !startTime || !slotDurationId) {
    return NextResponse.json(
      { error: "Missing required params: clubId, date, startTime, slotDurationId" },
      { status: 400 },
    );
  }

  const unavailableTableIds = await getUnavailableTableIds({ clubId, date, startTime, slotDurationId });
  return NextResponse.json({ unavailableTableIds });
}
