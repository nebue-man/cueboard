import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/data/bookings";

type Props = { params: Promise<{ id: string }> };

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingById(id);
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
            <dd className="font-medium">
              {new Date(booking.date).toLocaleDateString("en-LK", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </dd>
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
