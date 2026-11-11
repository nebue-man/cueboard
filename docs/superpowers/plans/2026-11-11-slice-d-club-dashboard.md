# Slice D: Club Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated club-owner dashboard — login, table inventory management, operating hours, product catalog, incoming bookings list, and no-show marking.

**Architecture:** Dashboard lives under `/dashboard` with a Next.js Route Group `(dashboard)` and a shared layout that checks auth. Auth is NextAuth.js with a Credentials provider (email + bcrypt password) using the `ClubOwner` model from Prisma. Each dashboard page is a Server Component; mutations go through API routes. Session contains `clubId` so every query is automatically scoped.

**Tech Stack:** NextAuth.js v5 (`next-auth@beta`), bcryptjs, Next.js App Router, Prisma, Zod, React Hook Form

**Prerequisite:** Slice A complete. Seed data has two club owners with known credentials.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/auth.ts` | NextAuth config: Credentials provider, session callback |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth catch-all route |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout: auth gate + sidebar nav |
| `src/app/(dashboard)/dashboard/page.tsx` | Overview: today's bookings count |
| `src/app/(dashboard)/dashboard/bookings/page.tsx` | Full bookings list with no-show button |
| `src/app/(dashboard)/dashboard/tables/page.tsx` | Table inventory: list, add, toggle active |
| `src/app/(dashboard)/dashboard/products/page.tsx` | Product catalog: list, add, toggle active |
| `src/app/(dashboard)/login/page.tsx` | Login form |
| `src/app/api/dashboard/tables/route.ts` | POST create table |
| `src/app/api/dashboard/tables/[id]/route.ts` | PATCH update table |
| `src/app/api/dashboard/products/route.ts` | POST create product |
| `src/app/api/dashboard/products/[id]/route.ts` | PATCH update product |
| `src/app/api/dashboard/bookings/[id]/no-show/route.ts` | PATCH mark booking no-show |

---

### Task 1: NextAuth configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Install NextAuth v5**

```bash
npm install next-auth@beta
```

- [ ] **Step 2: Write auth config**

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const owner = await db.clubOwner.findUnique({
          where: { email: parsed.data.email },
          include: { club: true },
        });
        if (!owner) return null;

        const valid = await bcrypt.compare(parsed.data.password, owner.passwordHash);
        if (!valid) return null;

        return { id: owner.id, name: owner.name, email: owner.email, clubId: owner.clubId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.clubId = (user as typeof user & { clubId: string }).clubId;
      return token;
    },
    session({ session, token }) {
      session.user.clubId = token.clubId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

declare module "next-auth" {
  interface Session {
    user: { clubId: string; name?: string | null; email?: string | null; image?: string | null };
  }
}
```

- [ ] **Step 3: Create route handler**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Add NEXTAUTH_SECRET to .env.local**

```bash
echo 'NEXTAUTH_SECRET="dev-secret-change-in-prod"' >> .env.local
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/
git commit -m "feat: add NextAuth with Credentials provider for club owners"
```

---

### Task 2: Login page

**Files:**
- Create: `src/app/(dashboard)/login/page.tsx`

- [ ] **Step 1: Implement login page**

```typescript
// src/app/(dashboard)/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email:    form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 font-serif text-3xl font-bold text-brand text-center">Club owner login</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue="owner@breakpoint.lk"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60 hover:bg-brand-light"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">Dev credentials: owner@breakpoint.lk / password123</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open http://localhost:3000/login — form renders, login with `owner@breakpoint.lk` / `password123` succeeds and redirects to `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/login/
git commit -m "feat: add club owner login page"
```

---

### Task 3: Dashboard layout with auth gate

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Implement auth-gated layout**

```typescript
// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/dashboard",          label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/tables",   label: "Tables" },
  { href: "/dashboard/products", label: "Products" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white px-4 py-6">
        <Link href="/dashboard" className="font-serif text-xl font-bold text-brand">
          CueBooking
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form
          className="mt-auto pt-8"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100">
            Sign out
          </button>
        </form>
      </aside>
      <div className="flex-1 overflow-auto bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: add auth-gated dashboard layout with sidebar nav"
```

---

### Task 4: Dashboard overview page

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/lib/data/dashboard.ts`

- [ ] **Step 1: Dashboard data queries**

```typescript
// src/lib/data/dashboard.ts
import { db } from "@/lib/db";

export async function getDashboardOverview(clubId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, totalBookings, club] = await Promise.all([
    db.booking.count({
      where: { clubId, date: { gte: today, lt: tomorrow }, status: "CONFIRMED" },
    }),
    db.booking.count({ where: { clubId } }),
    db.club.findUnique({ where: { id: clubId }, select: { name: true } }),
  ]);

  return { todayBookings, totalBookings, clubName: club?.name ?? "" };
}
```

- [ ] **Step 2: Dashboard overview page**

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const { todayBookings, totalBookings, clubName } = await getDashboardOverview(session!.user.clubId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">{clubName}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Bookings today</p>
          <p className="mt-2 font-serif text-4xl font-bold text-brand">{todayBookings}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total bookings</p>
          <p className="mt-2 font-serif text-4xl font-bold text-brand">{totalBookings}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx src/lib/data/dashboard.ts
git commit -m "feat: add dashboard overview with booking counts"
```

---

### Task 5: Bookings list with no-show

**Files:**
- Create: `src/app/(dashboard)/dashboard/bookings/page.tsx`
- Create: `src/app/api/dashboard/bookings/[id]/no-show/route.ts`

- [ ] **Step 1: No-show API route**

```typescript
// src/app/api/dashboard/bookings/[id]/no-show/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await db.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.clubId !== session.user.clubId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await db.booking.update({
    where: { id: params.id },
    data: { status: "NO_SHOW" },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Bookings page**

```typescript
// src/app/(dashboard)/dashboard/bookings/page.tsx
import { auth } from "@/lib/auth";
import { getClubBookings } from "@/lib/data/bookings";
import { NoShowButton } from "@/components/dashboard/NoShowButton";

export default async function BookingsPage() {
  const session  = await auth();
  const bookings = await getClubBookings(session!.user.clubId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Bookings</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Date", "Time", "Guest", "Players", "Tables", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(booking.date).toLocaleDateString("en-LK")}</td>
                <td className="px-4 py-3">{booking.startTime}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{booking.guestName}</p>
                  <p className="text-gray-400">{booking.guestPhone}</p>
                </td>
                <td className="px-4 py-3">{booking.playerCount}</td>
                <td className="px-4 py-3">{booking.bookingTables.map((bt) => bt.table.name).join(", ")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                    booking.status === "NO_SHOW"   ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {booking.status === "CONFIRMED" && (
                    <NoShowButton bookingId={booking.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create NoShowButton client component**

```typescript
// src/components/dashboard/NoShowButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NoShowButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markNoShow() {
    setLoading(true);
    await fetch(`/api/dashboard/bookings/${bookingId}/no-show`, { method: "PATCH" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={markNoShow}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "…" : "No-show"}
    </button>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/dashboard/bookings/ src/app/api/dashboard/bookings/ src/components/dashboard/
git commit -m "feat: add bookings dashboard with no-show marking"
```

---

### Task 6: Table inventory management

**Files:**
- Create: `src/app/(dashboard)/dashboard/tables/page.tsx`
- Create: `src/app/api/dashboard/tables/route.ts`
- Create: `src/app/api/dashboard/tables/[id]/route.ts`

- [ ] **Step 1: Tables API routes**

```typescript
// src/app/api/dashboard/tables/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateTableSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = CreateTableSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const table = await db.table.create({
    data: { ...parsed.data, clubId: session.user.clubId },
  });
  return NextResponse.json(table, { status: 201 });
}
```

```typescript
// src/app/api/dashboard/tables/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateTableSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = await db.table.findUnique({ where: { id: params.id } });
  if (!table || table.clubId !== session.user.clubId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body   = await req.json();
  const parsed = UpdateTableSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.table.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Tables page**

```typescript
// src/app/(dashboard)/dashboard/tables/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";
import { ToggleActiveButton } from "@/components/dashboard/ToggleActiveButton";
import { AddTableForm } from "@/components/dashboard/AddTableForm";

export default async function TablesPage() {
  const session = await auth();
  const tables  = await db.table.findMany({
    where: { clubId: session!.user.clubId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Tables</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Name", "Type", "Price / slot", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{table.name}</td>
                <td className="px-4 py-3"><TableTypeBadge type={table.type} /></td>
                <td className="px-4 py-3">LKR {table.pricePerSlot.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${table.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {table.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton id={table.id} isActive={table.isActive} endpoint="tables" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <h2 className="mb-4 font-serif text-lg font-semibold text-brand">Add a table</h2>
        <AddTableForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Shared ToggleActiveButton**

```typescript
// src/components/dashboard/ToggleActiveButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; isActive: boolean; endpoint: "tables" | "products" };

export function ToggleActiveButton({ id, isActive, endpoint }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/dashboard/${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
```

- [ ] **Step 4: AddTableForm**

```typescript
// src/components/dashboard/AddTableForm.tsx
"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTableSchema, CreateTableInput } from "@/lib/validations";

export function AddTableForm() {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTableInput>({
    resolver: zodResolver(CreateTableSchema),
  });

  async function onSubmit(data: CreateTableInput) {
    await fetch("/api/dashboard/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-3">
      <input {...register("name")} placeholder="Table name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      <select {...register("type")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none">
        <option value="POOL">Pool</option>
        <option value="SNOOKER">Snooker</option>
        <option value="BILLIARDS">Billiards</option>
        <option value="CAROM">Carom</option>
      </select>
      <input {...register("pricePerSlot", { valueAsNumber: true })} type="number" placeholder="Price per slot (LKR)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60">
        {isSubmitting ? "Adding…" : "Add table"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/dashboard/tables/ src/app/api/dashboard/tables/ src/components/dashboard/
git commit -m "feat: add table inventory management dashboard"
```

---

### Task 7: Product catalog management

**Files:**
- Create: `src/app/(dashboard)/dashboard/products/page.tsx`
- Create: `src/app/api/dashboard/products/route.ts`
- Create: `src/app/api/dashboard/products/[id]/route.ts`

- [ ] **Step 1: Products API routes**

```typescript
// src/app/api/dashboard/products/route.ts
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const product = await db.product.create({
    data: { ...parsed.data, clubId: session.user.clubId },
  });
  return NextResponse.json(product, { status: 201 });
}
```

```typescript
// src/app/api/dashboard/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateProductSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product || product.clubId !== session.user.clubId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = UpdateProductSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Products page (follows same pattern as Tables page)**

```typescript
// src/app/(dashboard)/dashboard/products/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ToggleActiveButton } from "@/components/dashboard/ToggleActiveButton";

export default async function ProductsPage() {
  const session  = await auth();
  const products = await db.product.findMany({
    where: { clubId: session!.user.clubId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand">Products & Services</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {["Name", "Type", "Price", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{p.type.toLowerCase()}</td>
                <td className="px-4 py-3">{p.price ? `LKR ${p.price.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton id={p.id} isActive={p.isActive} endpoint="products" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
git add src/app/(dashboard)/dashboard/products/ src/app/api/dashboard/products/
git commit -m "feat: add product catalog management dashboard"
```
