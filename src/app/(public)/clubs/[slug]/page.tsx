import { notFound } from "next/navigation";
import { getClubBySlug } from "@/lib/data/clubs";
import { TableTypeBadge } from "@/components/clubs/TableTypeBadge";
import { BookingWidget } from "@/components/booking/BookingWidget";

type Props = { params: Promise<{ slug: string }> };

export default async function ClubProfilePage({ params }: Props) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
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
    </div>
  );
}
