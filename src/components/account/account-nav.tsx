"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="md:w-48 shrink-0">
      {/* Horizontal tabs on mobile, vertical sidebar on desktop */}
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
        {links.map(({ href, label }) => {
          const isActive =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-ink shadow-sm border border-sand"
                    : "text-ink/60 hover:text-ink hover:bg-white/60"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li className="md:mt-4 md:border-t md:border-sand md:pt-4">
          <Link
            href="/sign-out"
            className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink/60 hover:text-ink hover:bg-white/60"
          >
            Sign out
          </Link>
        </li>
      </ul>
    </nav>
  );
}
