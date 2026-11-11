# Slice C: Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the guest checkout flow — date/time/table selection, guest details form, instant confirmation, and the POST /api/bookings endpoint.

**Architecture:** Booking widget is a multi-step client component embedded on the club profile page. Step 1: pick date + slot duration + start time. Step 2: pick tables (shown as a list with availability status). Step 3: guest details form. On submit, POST to `/api/bookings`, then redirect to `/bookings/[id]/confirmation`. Availability is enforced server-side by checking for conflicting bookings. No auth required.

**Tech Stack:** Next.js App Router, React (client components), Prisma, Zod, React Hook Form

**Prerequisite:** Slice A complete. Slice B complete (club profile page exists).

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/data/bookings.ts` | DB queries: create booking, get booking, check availability |
| `src/lib/data/bookings.test.ts` | Unit tests for booking data functions |
| `src/app/api/bookings/route.ts` | POST /api/bookings |
| `src/app/api/bookings/[id]/route.ts` | GET /api/bookings/:id |
| `src/app/api/availability/route.ts` | GET /api/availability?clubId=&date=&slotDurationId= |
| `src/components/booking/BookingWidget.tsx` | Multi-step booking shell (client) |
| `src/components/booking/SlotPicker.tsx` | Step 1: date + duration + time |
| `src/components/booking/TableSelector.tsx` | Step 2: table list with availability |
| `src/components/booking/GuestForm.tsx` | Step 3: name, phone, player count |
| `src/app/(public)/bookings/[id]/confirmation/page.tsx` | Confirmation page |

---

### Task 1: Booking data layer

**Files:**
- Create: `src/lib/data/bookings.ts`
- Create: `src/lib/data/bookings.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/data/bookings.test.ts
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
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm test src/lib/data/bookings.test.ts
```
Expected: `Cannot find module './bookings'`

- [ ] **Step 3: Implement bookings data layer**

```typescript
// src/lib/data/bookings.ts
import { db } from "@/lib/db";
import type { CreateBookingInput } from "@/lib/validations";

export async function createBooking(input: CreateBookingInput) {
  return db.booking.create({
    data: {
      clubId:        input.clubId,
      slotDurationId: input.slotDurationId,
      guestName:     input.guestName,
      guestPhone:    input.guestPhone,
      playerCount:   input.playerCount,
      date:          new Date(input.date),
      startTime:     input.startTime,
      status:        "CONFIRMED",
      bookingTables: {
        create: input.tableIds.map((tableId) => ({ tableId })),
      },
    },
    include: { bookingTables: { include: { table: true } }, slotDuration: true, club: true },
  });
}

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: { bookingTables: { include: { table: true } }, slotDuration: true, club: true },
  });
}

export async function getUnavailableTableIds(params: {
  clubId:        string;
  date:          string;
  startTime:     string;
  slotDurationId: string;
}) {
  const { clubId, date, startTime, slotDurationId } = params;
  const slotDuration = await db.slotDuration.findUnique({ where: { id: slotDurationId } });
  if (!slotDuration) return [];

  const bookingDate = new Date(date);
  const [startH, startM] = startTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes   = startMinutes + slotDuration.minutes;

  const conflicts = await db.booking.findMany({
    where: {
      clubId,
      date: bookingDate,
      status: "CONFIRMED",
    },
    include: { slotDuration: true, bookingTables: true },
  });

  const unavailable = new Set<string>();
  for (const booking of conflicts) {
    const [bH, bM]   = booking.startTime.split(":").map(Number);
    const bStart     = bH * 60 + bM;
    const bEnd       = bStart + booking.slotDuration.minutes;
    const overlaps   = startMinutes < bEnd && endMinutes > bStart;
    if (overlaps) {
      booking.bookingTables.forEach((bt) => unavailable.add(bt.tableId));
    }
  }

  return [...unavailable];
}

export async function getClubBookings(clubId: string) {
  return db.booking.findMany({
    where: { clubId },
    include: { bookingTables: { include: { table: true } }, slotDuration: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });
}
```

- [ ] **Step 4: Run tests to verify PASS**

```bash
npm test src/lib/data/bookings.test.ts
```
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/bookings.ts src/lib/data/bookings.test.ts
git commit -m "feat: add bookings data layer with availability check"
```

---

### Task 2: POST /api/bookings endpoint

**Files:**
- Create: `src/app/api/bookings/route.ts`

- [ ] **Step 1: Implement endpoint**

```typescript
// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CreateBookingSchema } from "@/lib/validations";
import { createBooking, getUnavailableTableIds } from "@/lib/data/bookings";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clubId, slotDurationId, tableIds, date, startTime } = parsed.data;

  const unavailable = await getUnavailableTableIds({ clubId, date, startTime, slotDurationId });
  const conflict = tableIds.some((id) => unavailable.includes(id));
  if (conflict) {
    return NextResponse.json(
      { error: "One or more selected tables are no longer available. Please try different times." },
      { status: 409 },
    );
  }

  const booking = await createBooking(parsed.data);
  return NextResponse.json({ bookingId: booking.id }, { status: 201 });
}
```

- [ ] **Step 2: Test manually with curl**

```bash
# Get a valid clubId and slotDurationId from your DB first:
npx prisma studio
# Then:
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "clubId": "<your-club-id>",
    "slotDurationId": "<your-slot-id>",
    "tableIds": ["<your-table-id>"],
    "guestName": "Test User",
    "guestPhone": "+94771234567",
    "playerCount": 2,
    "date": "2030-02-01",
    "startTime": "14:00"
  }'
```
Expected: `{"bookingId":"..."}` with status 201.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/
git commit -m "feat: add POST /api/bookings endpoint"
```

---

### Task 3: GET /api/availability endpoint

**Files:**
- Create: `src/app/api/availability/route.ts`

- [ ] **Step 1: Implement endpoint**

```typescript
// src/app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUnavailableTableIds } from "@/lib/data/bookings";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId        = searchParams.get("clubId");
  const date          = searchParams.get("date");
  const startTime     = searchParams.get("startTime");
  const slotDurationId = searchParams.get("slotDurationId");

  if (!clubId || !date || !startTime || !slotDurationId) {
    return NextResponse.json({ error: "Missing required params: clubId, date, startTime, slotDurationId" }, { status: 400 });
  }

  const unavailableTableIds = await getUnavailableTableIds({ clubId, date, startTime, slotDurationId });
  return NextResponse.json({ unavailableTableIds });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/availability/
git commit -m "feat: add GET /api/availability endpoint"
```

---

### Task 4: SlotPicker component (Step 1 of booking)

**Files:**
- Create: `src/components/booking/SlotPicker.tsx`

- [ ] **Step 1: Implement SlotPicker**

```typescript
// src/components/booking/SlotPicker.tsx
"use client";
import { useState } from "react";
import type { SlotDuration } from "@/types";

type Props = {
  slotDurations: SlotDuration[];
  onConfirm: (params: { date: string; startTime: string; slotDurationId: string }) => void;
};

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
});

export function SlotPicker({ slotDurations, onConfirm }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]           = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationId, setDurationId] = useState(slotDurations[0]?.id ?? "");

  const canContinue = date && startTime && durationId;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Choose a time</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Duration</label>
        <select
          value={durationId}
          onChange={(e) => setDurationId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {slotDurations.map((sd) => (
            <option key={sd.id} value={sd.id}>{sd.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Start time</label>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Select a time</option>
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <button
        disabled={!canContinue}
        onClick={() => onConfirm({ date, startTime, slotDurationId: durationId })}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40 hover:bg-brand-light"
      >
        See available tables
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/SlotPicker.tsx
git commit -m "feat: add SlotPicker booking step 1"
```

---

### Task 5: TableSelector component (Step 2 of booking)

**Files:**
- Create: `src/components/booking/TableSelector.tsx`

- [ ] **Step 1: Implement TableSelector**

```typescript
// src/components/booking/TableSelector.tsx
"use client";
import { useEffect, useState } from "react";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";
import type { Table } from "@/types";

type Props = {
  clubId:         string;
  date:           string;
  startTime:      string;
  slotDurationId: string;
  tables:         Table[];
  onConfirm:      (tableIds: string[]) => void;
  onBack:         () => void;
};

export function TableSelector({ clubId, date, startTime, slotDurationId, tables, onConfirm, onBack }: Props) {
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [selected, setSelected]       = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ clubId, date, startTime, slotDurationId });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => setUnavailable(data.unavailableTableIds ?? []))
      .finally(() => setLoading(false));
  }, [clubId, date, startTime, slotDurationId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (loading) return <p className="text-sm text-gray-500">Checking availability…</p>;

  const activeTables = tables.filter((t) => t.isActive);

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Select tables</h3>
      <p className="text-sm text-gray-500">
        {date} · {startTime} · {activeTables.length} tables
      </p>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {activeTables.map((table) => {
          const isUnavailable = unavailable.includes(table.id);
          const isSelected    = selected.includes(table.id);
          return (
            <button
              key={table.id}
              disabled={isUnavailable}
              onClick={() => toggle(table.id)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                isUnavailable ? "cursor-not-allowed opacity-40" :
                isSelected    ? "bg-brand/10 ring-inset ring-1 ring-brand" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <TableTypeBadge type={table.type} />
                <span className="text-sm font-medium">{table.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">LKR {table.pricePerSlot.toLocaleString()}</p>
                {isUnavailable && <p className="text-xs text-red-500">Unavailable</p>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50">
          Back
        </button>
        <button
          disabled={selected.length === 0}
          onClick={() => onConfirm(selected)}
          className="flex-1 rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40 hover:bg-brand-light"
        >
          Continue ({selected.length} table{selected.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/TableSelector.tsx
git commit -m "feat: add TableSelector booking step 2 with live availability"
```

---

### Task 6: GuestForm component (Step 3 of booking)

**Files:**
- Create: `src/components/booking/GuestForm.tsx`

- [ ] **Step 1: Install react-hook-form**

```bash
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Implement GuestForm**

```typescript
// src/components/booking/GuestForm.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const GuestSchema = z.object({
  guestName:   z.string().min(2, "Name must be at least 2 characters"),
  guestPhone:  z.string().min(7, "Enter a valid phone number"),
  playerCount: z.number({ coerce: true }).int().min(1).max(20),
});

type GuestFields = z.infer<typeof GuestSchema>;

type Props = {
  clubId:         string;
  slotDurationId: string;
  tableIds:       string[];
  date:           string;
  startTime:      string;
  onBack:         () => void;
};

export function GuestForm({ clubId, slotDurationId, tableIds, date, startTime, onBack }: Props) {
  const router      = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GuestFields>({
    resolver: zodResolver(GuestSchema),
    defaultValues: { playerCount: 1 },
  });

  async function onSubmit(data: GuestFields) {
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId, slotDurationId, tableIds, date, startTime, ...data }),
    });

    if (res.status === 409) {
      setError("One or more tables were just booked. Please go back and try again.");
      return;
    }
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    const { bookingId } = await res.json();
    router.push(`/bookings/${bookingId}/confirmation`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="font-serif text-xl font-semibold">Your details</h3>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register("guestName")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Your full name"
        />
        {errors.guestName && <p className="mt-1 text-xs text-red-600">{errors.guestName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
        <input
          {...register("guestPhone")}
          type="tel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="+94 77 123 4567"
        />
        {errors.guestPhone && <p className="mt-1 text-xs text-red-600">{errors.guestPhone.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Number of players</label>
        <input
          {...register("playerCount")}
          type="number"
          min={1}
          max={20}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {errors.playerCount && <p className="mt-1 text-xs text-red-600">{errors.playerCount.message}</p>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50">
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60 hover:bg-brand-light"
        >
          {isSubmitting ? "Confirming…" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/GuestForm.tsx
git commit -m "feat: add GuestForm booking step 3"
```

---

### Task 7: BookingWidget shell

**Files:**
- Create: `src/components/booking/BookingWidget.tsx`

- [ ] **Step 1: Implement multi-step shell**

```typescript
// src/components/booking/BookingWidget.tsx
"use client";
import { useState } from "react";
import { SlotPicker } from "./SlotPicker";
import { TableSelector } from "./TableSelector";
import { GuestForm } from "./GuestForm";
import type { SlotDuration, Table } from "@/types";

type Step = "slot" | "tables" | "guest";

type SlotSelection = { date: string; startTime: string; slotDurationId: string };

type Props = {
  clubId:        string;
  slotDurations: SlotDuration[];
  tables:        Table[];
};

export function BookingWidget({ clubId, slotDurations, tables }: Props) {
  const [step, setStep]           = useState<Step>("slot");
  const [slot, setSlot]           = useState<SlotSelection | null>(null);
  const [tableIds, setTableIds]   = useState<string[]>([]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        {(["slot", "tables", "guest"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              step === s ? "bg-brand" :
              (step === "tables" && s === "slot") || step === "guest" ? "bg-brand/40" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === "slot" && (
        <SlotPicker
          slotDurations={slotDurations}
          onConfirm={(s) => { setSlot(s); setStep("tables"); }}
        />
      )}

      {step === "tables" && slot && (
        <TableSelector
          clubId={clubId}
          date={slot.date}
          startTime={slot.startTime}
          slotDurationId={slot.slotDurationId}
          tables={tables}
          onConfirm={(ids) => { setTableIds(ids); setStep("guest"); }}
          onBack={() => setStep("slot")}
        />
      )}

      {step === "guest" && slot && (
        <GuestForm
          clubId={clubId}
          slotDurationId={slot.slotDurationId}
          tableIds={tableIds}
          date={slot.date}
          startTime={slot.startTime}
          onBack={() => setStep("tables")}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire widget into club profile page**

In `src/app/(public)/clubs/[slug]/page.tsx`, replace the placeholder div:

```typescript
import { BookingWidget } from "@/components/booking/BookingWidget";
// ...
<section className="mt-10">
  <h2 className="font-serif text-2xl font-semibold text-brand">Book a table</h2>
  <div className="mt-4">
    <BookingWidget
      clubId={club.id}
      slotDurations={club.slotDurations}
      tables={club.tables.filter((t) => t.isActive)}
    />
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/BookingWidget.tsx src/app/(public)/clubs/[slug]/page.tsx
git commit -m "feat: add BookingWidget and wire into club profile"
```

---

### Task 8: Booking confirmation page

**Files:**
- Create: `src/app/api/bookings/[id]/route.ts`
- Create: `src/app/(public)/bookings/[id]/confirmation/page.tsx`

- [ ] **Step 1: GET /api/bookings/:id**

```typescript
// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/data/bookings";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await getBookingById(params.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}
```

- [ ] **Step 2: Confirmation page**

```typescript
// src/app/(public)/bookings/[id]/confirmation/page.tsx
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/data/bookings";

export default async function ConfirmationPage({ params }: { params: { id: string } }) {
  const booking = await getBookingById(params.id);
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="text-5xl">🎱</div>
      <h1 className="mt-4 font-serif text-3xl font-bold text-brand">Booking confirmed!</h1>
      <p className="mt-2 text-gray-600">See you at <strong>{booking.club.name}</strong></p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Date</dt>
            <dd className="font-medium">{new Date(booking.date).toLocaleDateString("en-LK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Start time</dt>
            <dd className="font-medium">{booking.startTime}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Duration</dt>
            <dd className="font-medium">{booking.slotDuration.label}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Tables</dt>
            <dd className="font-medium">{booking.bookingTables.map((bt) => bt.table.name).join(", ")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Players</dt>
            <dd className="font-medium">{booking.playerCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{booking.guestName}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Payment is at the venue. Please arrive on time.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bookings/ src/app/(public)/bookings/
git commit -m "feat: add booking confirmation page"
```
