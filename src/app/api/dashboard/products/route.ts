import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateProductSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type:        z.enum(["PHYSICAL", "SERVICE"]),
  price:       z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CreateProductSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const product = await db.product.create({
    data: { ...parsed.data, clubId: session.user.clubId },
  });
  return NextResponse.json(product, { status: 201 });
}
