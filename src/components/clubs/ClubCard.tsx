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
