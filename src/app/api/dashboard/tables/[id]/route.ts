import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateTableSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const table = await db.table.findUnique({ where: { id } });
  if (!table || table.clubId !== session.user.clubId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body   = await req.json();
  const parsed = UpdateTableSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const updated = await db.table.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
