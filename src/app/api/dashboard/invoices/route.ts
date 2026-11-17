import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInvoice, getInvoicesForClub } from "@/lib/data/invoices";
import { z } from "zod";

const GenerateSchema = z.object({
  periodStart:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commissionRate: z.number().min(0).max(1).default(0.1),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await getInvoicesForClub(session.user.clubId);
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = GenerateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const invoice = await generateInvoice({ clubId: session.user.clubId, ...parsed.data });
  return NextResponse.json(invoice, { status: 201 });
}
