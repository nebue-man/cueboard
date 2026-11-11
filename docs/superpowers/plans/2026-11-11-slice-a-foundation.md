# Slice A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Next.js project with TypeScript, Prisma schema, seed data, and shared types so every subsequent slice has a stable foundation to build on.

**Architecture:** Next.js 14 App Router with TypeScript strict mode. Prisma + PostgreSQL as the data layer. All domain types are generated from the Prisma schema — no hand-written type duplication. A seed script populates two clubs with tables, slots, and products for local development.

**Tech Stack:** Next.js 14, TypeScript 5, Prisma 5, PostgreSQL, Tailwind CSS, shadcn/ui, Zod, Jest + Testing Library

---

## File Map

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | Single source of truth for all domain types |
| `prisma/seed.ts` | Two sample clubs with tables, slots, products |
| `src/lib/db.ts` | Prisma client singleton (dev-safe) |
| `src/lib/validations.ts` | Zod schemas for all API inputs |
| `src/types/index.ts` | Re-exports Prisma generated types + Zod inferred types |
| `src/app/layout.tsx` | Root layout: fonts, Tailwind base, metadata |
| `src/app/page.tsx` | Placeholder home page (replaced in Slice B) |
| `tailwind.config.ts` | Design tokens: colors, fonts, spacing |
| `jest.config.ts` | Jest config for Next.js |
| `src/lib/db.test.ts` | Smoke test: DB connection and seed data shape |

---

### Task 1: Initialise Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `.gitignore`

- [ ] **Step 1: Scaffold project**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```
Expected: server on http://localhost:3000, no errors in terminal.

- [ ] **Step 3: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cuebooking"
NEXTAUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_MAPS_API_KEY=""
WHATSAPP_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
EOF
cp .env.example .env.local
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialise Next.js 14 project"
```

---

### Task 2: Install and configure Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json`

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Club {
  id          String    @id @default(cuid())
  slug        String    @unique
  name        String
  description String?
  address     String
  city        String
  lat         Float
  lng         Float
  phone       String
  whatsappId  String?
  coverImage  String?
  photos      String[]
  rating      Float     @default(0)
  ratingCount Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tables       Table[]
  slotDurations SlotDuration[]
  products     Product[]
  bookings     Booking[]
  owners       ClubOwner[]
  invoices     Invoice[]
}

model Table {
  id        String    @id @default(cuid())
  clubId    String
  name      String
  type      TableType
  pricePerSlot Float
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())

  club          Club           @relation(fields: [clubId], references: [id])
  bookingTables BookingTable[]
}

enum TableType {
  POOL
  SNOOKER
  BILLIARDS
  CAROM
}

model SlotDuration {
  id        String   @id @default(cuid())
  clubId    String
  minutes   Int
  label     String
  createdAt DateTime @default(now())

  club     Club      @relation(fields: [clubId], references: [id])
  bookings Booking[]
}

model OperatingHours {
  id        String  @id @default(cuid())
  clubId    String
  dayOfWeek Int     // 0=Sun, 6=Sat
  openTime  String  // "09:00"
  closeTime String  // "22:00"
  isClosed  Boolean @default(false)
}

model Product {
  id          String      @id @default(cuid())
  clubId      String
  name        String
  description String?
  type        ProductType
  price       Float?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())

  club Club @relation(fields: [clubId], references: [id])
}

enum ProductType {
  PHYSICAL
  SERVICE
}

model Booking {
  id             String        @id @default(cuid())
  clubId         String
  slotDurationId String
  guestName      String
  guestPhone     String
  playerCount    Int
  date           DateTime      @db.Date
  startTime      String        // "14:00"
  status         BookingStatus @default(CONFIRMED)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  club          Club           @relation(fields: [clubId], references: [id])
  slotDuration  SlotDuration   @relation(fields: [slotDurationId], references: [id])
  bookingTables BookingTable[]
  rating        Rating?
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  NO_SHOW
}

model BookingTable {
  bookingId String
  tableId   String

  booking Booking @relation(fields: [bookingId], references: [id])
  table   Table   @relation(fields: [tableId], references: [id])

  @@id([bookingId, tableId])
}

model Rating {
  id        String   @id @default(cuid())
  bookingId String   @unique
  clubId    String
  stars     Int
  createdAt DateTime @default(now())

  booking Booking @relation(fields: [bookingId], references: [id])
}

model ClubOwner {
  id           String   @id @default(cuid())
  clubId       String
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())

  club Club @relation(fields: [clubId], references: [id])
}

model Invoice {
  id            String        @id @default(cuid())
  clubId        String
  periodStart   DateTime
  periodEnd     DateTime
  bookingCount  Int
  commissionRate Float        @default(0.1)
  totalAmount   Float
  status        InvoiceStatus @default(PENDING)
  createdAt     DateTime      @default(now())

  club Club @relation(fields: [clubId], references: [id])
}

enum InvoiceStatus {
  PENDING
  SENT
  PAID
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```
Expected: `✔ Your database is now in sync with your schema.`

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/
git commit -m "feat: add Prisma schema — clubs, tables, bookings, invoices"
```

---

### Task 3: Prisma client singleton

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Write singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Prisma client singleton"
```

---

### Task 4: Seed database

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Add seed script to package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

Install ts-node:
```bash
npm install -D ts-node
```

- [ ] **Step 2: Write seed**

```typescript
// prisma/seed.ts
import { PrismaClient, TableType, ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.club.deleteMany();

  const club1 = await prisma.club.create({
    data: {
      slug: "break-point-colombo",
      name: "Break Point Colombo",
      description: "Colombo's premier billiards club with 12 professional tables.",
      address: "42 Galle Road, Colombo 03",
      city: "Colombo",
      lat: 6.8928,
      lng: 79.8508,
      phone: "+94 11 234 5678",
      coverImage: "/images/sample-club-1.jpg",
      tables: {
        create: [
          { name: "Table 1 — Snooker", type: TableType.SNOOKER, pricePerSlot: 1500 },
          { name: "Table 2 — Snooker", type: TableType.SNOOKER, pricePerSlot: 1500 },
          { name: "Table 3 — Pool",    type: TableType.POOL,    pricePerSlot: 1000 },
          { name: "Table 4 — Pool",    type: TableType.POOL,    pricePerSlot: 1000 },
        ],
      },
      slotDurations: {
        create: [
          { minutes: 60,  label: "1 hour" },
          { minutes: 120, label: "2 hours" },
        ],
      },
      products: {
        create: [
          { name: "Cue Rental",   type: ProductType.PHYSICAL, price: 200,  description: "Professional cue rental per session" },
          { name: "Coaching",     type: ProductType.SERVICE,  price: 3000, description: "1-hour coaching with our resident pro" },
          { name: "Soft Drinks",  type: ProductType.PHYSICAL, price: 150,  description: "Assorted soft drinks" },
        ],
      },
      owners: {
        create: {
          email: "owner@breakpoint.lk",
          passwordHash: await bcrypt.hash("password123", 10),
          name: "Kamal Perera",
        },
      },
    },
  });

  const club2 = await prisma.club.create({
    data: {
      slug: "cue-masters-nugegoda",
      name: "Cue Masters Nugegoda",
      description: "Relaxed club in the heart of Nugegoda with 8 tables.",
      address: "18 High Level Road, Nugegoda",
      city: "Colombo",
      lat: 6.8699,
      lng: 79.8894,
      phone: "+94 11 876 5432",
      tables: {
        create: [
          { name: "Table A — Snooker",  type: TableType.SNOOKER,  pricePerSlot: 1200 },
          { name: "Table B — Billiards", type: TableType.BILLIARDS, pricePerSlot: 1000 },
          { name: "Table C — Pool",     type: TableType.POOL,     pricePerSlot: 800  },
        ],
      },
      slotDurations: {
        create: [
          { minutes: 60, label: "1 hour" },
        ],
      },
      products: {
        create: [
          { name: "Cue Rental", type: ProductType.PHYSICAL, price: 150 },
        ],
      },
      owners: {
        create: {
          email: "owner@cuemasters.lk",
          passwordHash: await bcrypt.hash("password123", 10),
          name: "Nimal Silva",
        },
      },
    },
  });

  console.log(`Seeded clubs: ${club1.name}, ${club2.name}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```
Expected: `Seeded clubs: Break Point Colombo, Cue Masters Nugegoda`

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data with two sample clubs"
```

---

### Task 5: Shared types and Zod validations

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/validations.ts`

- [ ] **Step 1: Write types barrel**

```typescript
// src/types/index.ts
export type {
  Club,
  Table,
  SlotDuration,
  Product,
  Booking,
  BookingTable,
  Rating,
  ClubOwner,
  Invoice,
  OperatingHours,
} from "@prisma/client";

export { TableType, ProductType, BookingStatus, InvoiceStatus } from "@prisma/client";
```

- [ ] **Step 2: Write Zod validations**

```typescript
// src/lib/validations.ts
import { z } from "zod";

export const CreateBookingSchema = z.object({
  clubId:          z.string().cuid(),
  slotDurationId:  z.string().cuid(),
  tableIds:        z.array(z.string().cuid()).min(1),
  guestName:       z.string().min(2).max(100),
  guestPhone:      z.string().min(7).max(20),
  playerCount:     z.number().int().min(1).max(20),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:       z.string().regex(/^\d{2}:\d{2}$/),
});

export const UpdateTableSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  pricePerSlot: z.number().positive().optional(),
  isActive:     z.boolean().optional(),
});

export const CreateTableSchema = z.object({
  name:         z.string().min(1).max(100),
  type:         z.enum(["POOL", "SNOOKER", "BILLIARDS", "CAROM"]),
  pricePerSlot: z.number().positive(),
});

export const UpdateProductSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price:       z.number().positive().optional(),
  isActive:    z.boolean().optional(),
});

export type CreateBookingInput  = z.infer<typeof CreateBookingSchema>;
export type UpdateTableInput    = z.infer<typeof UpdateTableSchema>;
export type CreateTableInput    = z.infer<typeof CreateTableSchema>;
export type UpdateProductInput  = z.infer<typeof UpdateProductSchema>;
```

- [ ] **Step 3: Install Zod**

```bash
npm install zod
```

- [ ] **Step 4: Commit**

```bash
git add src/types/ src/lib/validations.ts
git commit -m "feat: add shared types and Zod validation schemas"
```

---

### Task 6: Configure Jest

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest @types/jest jest-environment-jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event ts-jest
```

- [ ] **Step 2: Write jest config**

```typescript
// jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

export default createJestConfig(config);
```

- [ ] **Step 3: Write jest setup**

```typescript
// jest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add test scripts to package.json**

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:ci": "jest --ci --coverage"
}
```

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: configure Jest with Testing Library"
```

---

### Task 7: Tailwind design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Set design tokens**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1a3a5c",
          light:   "#2a5a8c",
          dark:    "#0d1f33",
        },
        surface: {
          DEFAULT: "#fafaf8",
          dark:    "#0f172a",
        },
        accent: "#c8a96e",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Update root layout with fonts**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "CueBooking — Book a billiards table",
  description: "Discover and book billiards clubs in your city.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-surface font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Placeholder home page**

```typescript
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-serif text-4xl text-brand">CueBooking</h1>
    </main>
  );
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/app/
git commit -m "feat: add design tokens and root layout"
```

---

### Task 8: Smoke test for DB connection

**Files:**
- Create: `src/lib/db.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/db.test.ts
import { db } from "./db";

describe("database", () => {
  afterAll(() => db.$disconnect());

  it("can query clubs table", async () => {
    const clubs = await db.club.findMany({ take: 5 });
    expect(Array.isArray(clubs)).toBe(true);
  });

  it("seed data has at least two clubs", async () => {
    const count = await db.club.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("each club has at least one table", async () => {
    const clubs = await db.club.findMany({ include: { tables: true }, take: 2 });
    for (const club of clubs) {
      expect(club.tables.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails (no DB yet)**

```bash
npm test src/lib/db.test.ts
```
Expected: connection error or FAIL.

- [ ] **Step 3: Ensure DB is running and seeded**

```bash
npx prisma migrate dev
npx prisma db seed
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/lib/db.test.ts
```
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.test.ts
git commit -m "test: smoke test DB connection and seed data"
```
