# Slice B: Club Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing discovery experience — club list with search and availability filter, map view, and individual club profile pages.

**Architecture:** Server Components fetch club data at request time via the data layer (`src/lib/data/clubs.ts`). The map is client-rendered (Google Maps JS API). Club profiles are server-rendered with a client-side booking widget placeholder. No auth required on any page in this slice.

**Tech Stack:** Next.js 14 App Router, Prisma, Google Maps JS API (`@react-google-maps/api`), Tailwind CSS, shadcn/ui (Card, Badge, Input, Select)

**Prerequisite:** Slice A complete — DB running and seeded.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/data/clubs.ts` | All DB queries for clubs (list, search, get by slug) |
| `src/lib/data/clubs.test.ts` | Unit tests for club data functions |
| `src/app/(public)/layout.tsx` | Public layout: nav + footer |
| `src/app/(public)/page.tsx` | Home page with hero + search entry point |
| `src/app/(public)/clubs/page.tsx` | Club list with filters (server + client) |
| `src/app/(public)/clubs/[slug]/page.tsx` | Club profile page |
| `src/components/clubs/ClubCard.tsx` | Club summary card |
| `src/components/clubs/ClubCard.test.tsx` | Tests for ClubCard |
| `src/components/clubs/ClubMap.tsx` | Google Maps client component |
| `src/components/clubs/AvailabilityFilter.tsx` | Date + time filter (client) |
| `src/components/clubs/TableTypeBadge.tsx` | Coloured badge for POOL / SNOOKER etc. |

---

### Task 1: Club data layer

**Files:**
- Create: `src/lib/data/clubs.ts`
- Create: `src/lib/data/clubs.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/data/clubs.test.ts
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
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm test src/lib/data/clubs.test.ts
```
Expected: `Cannot find module './clubs'`

- [ ] **Step 3: Implement data layer**

```typescript
// src/lib/data/clubs.ts
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

  // Filter out clubs with conflicting bookings at the requested date/time
  return clubs.filter((club) => {
    // Availability conflict check handled client-side in Phase 1
    // Full server-side check added in Slice C when booking logic is complete
    return true;
  });
}
```

- [ ] **Step 4: Run tests to verify PASS**

```bash
npm test src/lib/data/clubs.test.ts
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/
git commit -m "feat: add clubs data layer with search and slug lookup"
```

---

### Task 2: TableTypeBadge component

**Files:**
- Create: `src/components/clubs/TableTypeBadge.tsx`
- Create: `src/components/clubs/TableTypeBadge.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/clubs/TableTypeBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { TableTypeBadge } from "./TableTypeBadge";

describe("TableTypeBadge", () => {
  it("renders SNOOKER label", () => {
    render(<TableTypeBadge type="SNOOKER" />);
    expect(screen.getByText("Snooker")).toBeInTheDocument();
  });

  it("renders POOL label", () => {
    render(<TableTypeBadge type="POOL" />);
    expect(screen.getByText("Pool")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm test src/components/clubs/TableTypeBadge.test.tsx
```
Expected: `Cannot find module './TableTypeBadge'`

- [ ] **Step 3: Implement component**

```typescript
// src/components/clubs/TableTypeBadge.tsx
import { TableType } from "@/types";

const labels: Record<TableType, string> = {
  POOL:      "Pool",
  SNOOKER:   "Snooker",
  BILLIARDS: "Billiards",
  CAROM:     "Carom",
};

const colors: Record<TableType, string> = {
  POOL:      "bg-blue-100 text-blue-800",
  SNOOKER:   "bg-green-100 text-green-800",
  BILLIARDS: "bg-purple-100 text-purple-800",
  CAROM:     "bg-amber-100 text-amber-800",
};

export function TableTypeBadge({ type }: { type: TableType }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[type]}`}>
      {labels[type]}
    </span>
  );
}
```

- [ ] **Step 4: Run tests to verify PASS**

```bash
npm test src/components/clubs/TableTypeBadge.test.tsx
```
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/clubs/TableTypeBadge.tsx src/components/clubs/TableTypeBadge.test.tsx
git commit -m "feat: add TableTypeBadge component"
```

---

### Task 3: ClubCard component

**Files:**
- Create: `src/components/clubs/ClubCard.tsx`
- Create: `src/components/clubs/ClubCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/clubs/ClubCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ClubCard } from "./ClubCard";

const mockClub = {
  id: "1",
  slug: "break-point-colombo",
  name: "Break Point Colombo",
  address: "42 Galle Road, Colombo 03",
  city: "Colombo",
  rating: 4.5,
  ratingCount: 24,
  coverImage: null,
  tables: [
    { id: "t1", type: "SNOOKER" as const, name: "Table 1", pricePerSlot: 1500, clubId: "1", isActive: true, createdAt: new Date() },
    { id: "t2", type: "POOL" as const,    name: "Table 2", pricePerSlot: 1000, clubId: "1", isActive: true, createdAt: new Date() },
  ],
};

describe("ClubCard", () => {
  it("renders club name", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("Break Point Colombo")).toBeInTheDocument();
  });

  it("renders address", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("42 Galle Road, Colombo 03")).toBeInTheDocument();
  });

  it("renders table type badges", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByText("Snooker")).toBeInTheDocument();
    expect(screen.getByText("Pool")).toBeInTheDocument();
  });

  it("links to club profile", () => {
    render(<ClubCard club={mockClub} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/clubs/break-point-colombo");
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
npm test src/components/clubs/ClubCard.test.tsx
```
Expected: `Cannot find module './ClubCard'`

- [ ] **Step 3: Implement ClubCard**

```typescript
// src/components/clubs/ClubCard.tsx
import Link from "next/link";
import Image from "next/image";
import { TableTypeBadge } from "./TableTypeBadge";
import type { Club, Table } from "@/types";

type Props = {
  club: Pick<Club, "slug" | "name" | "address" | "rating" | "ratingCount" | "coverImage"> & {
    tables: Pick<Table, "id" | "type">[];
  };
};

export function ClubCard({ club }: Props) {
  const uniqueTypes = [...new Set(club.tables.map((t) => t.type))];

  return (
    <Link href={`/clubs/${club.slug}`} className="group block rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-gray-100">
        {club.coverImage ? (
          <Image src={club.coverImage} alt={club.name} fill className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">No photo</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-brand">{club.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{club.address}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {uniqueTypes.map((type) => (
            <TableTypeBadge key={type} type={type} />
          ))}
        </div>
        {club.ratingCount > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            ★ {club.rating.toFixed(1)} <span className="text-gray-400">({club.ratingCount})</span>
          </p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests to verify PASS**

```bash
npm test src/components/clubs/ClubCard.test.tsx
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/clubs/ClubCard.tsx src/components/clubs/ClubCard.test.tsx
git commit -m "feat: add ClubCard component"
```

---

### Task 4: Public layout (nav + footer)

**Files:**
- Create: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Implement layout**

```typescript
// src/app/(public)/layout.tsx
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-serif text-2xl font-bold text-brand">
            CueBooking
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/clubs" className="hover:text-brand">Find a club</Link>
            <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-light">
              Club owners
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} CueBooking · <Link href="/privacy" className="hover:underline">Privacy</Link></p>
      </footer>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/
git commit -m "feat: add public layout with nav and footer"
```

---

### Task 5: Home page

**Files:**
- Create: `src/app/(public)/page.tsx`

- [ ] **Step 1: Implement home page**

```typescript
// src/app/(public)/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="flex flex-col items-center py-24 text-center">
        <h1 className="font-serif text-5xl font-bold text-brand md:text-6xl">
          Book a table.<br />Play today.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          Discover billiards clubs near you, check availability, and reserve
          your table in seconds — no account needed.
        </p>
        <Link
          href="/clubs"
          className="mt-8 rounded-xl bg-brand px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-brand-light"
        >
          Find a club
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: add home page hero"
```

---

### Task 6: Club list page

**Files:**
- Create: `src/app/(public)/clubs/page.tsx`
- Create: `src/components/clubs/AvailabilityFilter.tsx`

- [ ] **Step 1: Implement AvailabilityFilter (client component)**

```typescript
// src/components/clubs/AvailabilityFilter.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { TableType } from "@/types";

const TABLE_TYPES: { value: TableType | ""; label: string }[] = [
  { value: "",          label: "All types" },
  { value: "POOL",      label: "Pool" },
  { value: "SNOOKER",   label: "Snooker" },
  { value: "BILLIARDS", label: "Billiards" },
  { value: "CAROM",     label: "Carom" },
];

export function AvailabilityFilter() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/clubs?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={params.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {TABLE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <input
        type="date"
        defaultValue={params.get("date") ?? ""}
        onChange={(e) => update("date", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement club list page**

```typescript
// src/app/(public)/clubs/page.tsx
import { Suspense } from "react";
import { searchClubs } from "@/lib/data/clubs";
import { ClubCard } from "@/components/clubs/ClubCard";
import { AvailabilityFilter } from "@/components/clubs/AvailabilityFilter";
import { TableType } from "@/types";

type SearchParams = { type?: string; date?: string };

export default async function ClubsPage({ searchParams }: { searchParams: SearchParams }) {
  const tableType = searchParams.type as TableType | undefined;
  const clubs = await searchClubs({ tableType, date: searchParams.date });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-brand">Find a club</h1>
      <div className="mt-4">
        <Suspense>
          <AvailabilityFilter />
        </Suspense>
      </div>
      {clubs.length === 0 ? (
        <p className="mt-12 text-center text-gray-500">No clubs found. Try different filters.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify page renders**

```bash
npm run dev
```
Open http://localhost:3000/clubs — should show two club cards.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/clubs/ src/components/clubs/AvailabilityFilter.tsx
git commit -m "feat: add club list page with type filter"
```

---

### Task 7: Club profile page

**Files:**
- Create: `src/app/(public)/clubs/[slug]/page.tsx`

- [ ] **Step 1: Implement club profile**

```typescript
// src/app/(public)/clubs/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getClubBySlug } from "@/lib/data/clubs";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";

export default async function ClubProfilePage({ params }: { params: { slug: string } }) {
  const club = await getClubBySlug(params.slug);
  if (!club) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-4xl font-bold text-brand">{club.name}</h1>
      <p className="mt-2 text-gray-500">{club.address}</p>
      {club.rating > 0 && (
        <p className="mt-1 text-sm text-gray-600">★ {club.rating.toFixed(1)} ({club.ratingCount} ratings)</p>
      )}
      {club.description && (
        <p className="mt-4 text-gray-700">{club.description}</p>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-brand">Tables</h2>
        <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
          {club.tables.filter((t) => t.isActive).map((table) => (
            <div key={table.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <TableTypeBadge type={table.type} />
                <span className="text-sm font-medium">{table.name}</span>
              </div>
              <span className="text-sm text-gray-600">LKR {table.pricePerSlot.toLocaleString()} / slot</span>
            </div>
          ))}
        </div>
      </section>

      {club.products.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl font-semibold text-brand">Products & Services</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {club.products.map((product) => (
              <div key={product.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium">{product.name}</p>
                {product.description && <p className="mt-1 text-sm text-gray-500">{product.description}</p>}
                {product.price && <p className="mt-2 text-sm font-semibold text-brand">LKR {product.price.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-brand">Contact</h2>
        <p className="mt-2 text-gray-700">📞 {club.phone}</p>
      </section>

      <div className="mt-10 rounded-xl border-2 border-dashed border-brand/30 p-8 text-center text-gray-500">
        Booking widget — implemented in Slice C
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Open http://localhost:3000/clubs/break-point-colombo — should show full profile.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/clubs/[slug]/
git commit -m "feat: add club profile page"
```

---

### Task 8: Google Maps view (optional — requires API key)

**Files:**
- Create: `src/components/clubs/ClubMap.tsx`

- [ ] **Step 1: Install maps library**

```bash
npm install @react-google-maps/api
```

- [ ] **Step 2: Implement map component**

```typescript
// src/components/clubs/ClubMap.tsx
"use client";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import type { Club } from "@/types";

type Props = {
  clubs: Pick<Club, "id" | "name" | "lat" | "lng" | "slug">[];
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "400px" };
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo

export function ClubMap({ clubs }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (!isLoaded) return <div className="h-96 w-full animate-pulse rounded-xl bg-gray-100" />;

  return (
    <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} zoom={12} center={DEFAULT_CENTER}>
      {clubs.map((club) => (
        <Marker
          key={club.id}
          position={{ lat: club.lat, lng: club.lng }}
          title={club.name}
          onClick={() => (window.location.href = `/clubs/${club.slug}`)}
        />
      ))}
    </GoogleMap>
  );
}
```

- [ ] **Step 3: Add map to clubs page**

In `src/app/(public)/clubs/page.tsx`, add above the grid:

```typescript
import { ClubMap } from "@/components/clubs/ClubMap";
// ...
<div className="mt-6 overflow-hidden rounded-xl">
  <ClubMap clubs={clubs.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng, slug: c.slug }))} />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/clubs/ClubMap.tsx src/app/(public)/clubs/page.tsx
git commit -m "feat: add Google Maps view on clubs list page"
```

---

### Task 9: Build and lint check

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: all passing.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: no errors.
