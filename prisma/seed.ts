import { PrismaClient, TableType, ProductType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://dilshan@localhost:5432/cuebooking";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.bookingTable.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.operatingHours.deleteMany();
  await prisma.slotDuration.deleteMany();
  await prisma.product.deleteMany();
  await prisma.table.deleteMany();
  await prisma.clubOwner.deleteMany();
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
          { name: "Cue Rental",  type: ProductType.PHYSICAL, price: 200,  description: "Professional cue rental per session" },
          { name: "Coaching",    type: ProductType.SERVICE,  price: 3000, description: "1-hour coaching with our resident pro" },
          { name: "Soft Drinks", type: ProductType.PHYSICAL, price: 150,  description: "Assorted soft drinks" },
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
          { name: "Table A — Snooker",   type: TableType.SNOOKER,   pricePerSlot: 1200 },
          { name: "Table B — Billiards", type: TableType.BILLIARDS, pricePerSlot: 1000 },
          { name: "Table C — Pool",      type: TableType.POOL,      pricePerSlot: 800  },
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
