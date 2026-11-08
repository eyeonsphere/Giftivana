"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "🛍️" },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
  { href: "/admin/occasions", label: "Occasions", icon: "🎉" },
  { href: "/admin/partners", label: "Partners", icon: "🤝" },
  { href: "/admin/destinations", label: "Destinations", icon: "📍" },
  { href: "/admin/gift-cards", label: "Gift Cards", icon: "🎁" },
  { href: "/admin/audit", label: "Audit Log", icon: "📋" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminNav({
  userName,
  userRole,
}: {
  userName: string | null;
  userRole: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const userBlock = (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="px-3 mb-3">
        <p className="text-sm font-medium text-gray-900 truncate">
          {userName ?? "Staff"}
        </p>
        <span className="inline-block mt-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
          {userRole}
        </span>
      </div>
      <Link
        href="/sign-out"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <span className="text-base">🚪</span>
        Sign out
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white lg:min-h-screen lg:fixed lg:inset-y-0 lg:z-30">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Giftivana</span>
          <span className="rounded-full bg-gray-900 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">{links}</nav>
        <div className="px-3 pb-4">{userBlock}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">Giftivana</span>
          <span className="rounded-full bg-gray-900 text-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">{links}</nav>
            <div className="px-3 pb-4">{userBlock}</div>
          </div>
        </>
      )}
    </>
  );
}
