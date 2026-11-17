import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.clubId !== session.user.clubId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await db.booking.update({
    where: { id },
    data: { status: "NO_SHOW" },
  });

  return NextResponse.json(updated);
}
