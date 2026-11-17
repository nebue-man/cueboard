import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/dashboard",          label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/tables",   label: "Tables" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/invoices", label: "Invoices" },
];

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

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
          action={handleSignOut}
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
