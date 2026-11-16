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
