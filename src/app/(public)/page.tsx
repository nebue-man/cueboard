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
