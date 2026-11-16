import { Suspense } from "react";
import { searchClubs } from "@/lib/data/clubs";
import { ClubCard } from "@/components/clubs/ClubCard";
import { AvailabilityFilter } from "@/components/clubs/AvailabilityFilter";
import { ClubMap } from "@/components/clubs/ClubMap";
import { TableType } from "@/types";

type SearchParams = Promise<{ type?: string; date?: string }>;

export default async function ClubsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type, date } = await searchParams;
  const tableType = type as TableType | undefined;
  const clubs = await searchClubs({ tableType, date });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-brand">Find a club</h1>
      <div className="mt-4">
        <Suspense>
          <AvailabilityFilter />
        </Suspense>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl">
        <ClubMap clubs={clubs.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng, slug: c.slug }))} />
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
