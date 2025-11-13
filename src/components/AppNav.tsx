"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  Heart,
  User,
  BarChart3,
  Package,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const AppNav = memo(function AppNav() {
  const pathname = usePathname();
  const { profile, loading } = useAuth() || {};

  if (loading) return null;

  const role = (profile?.role ?? "consumer").toLowerCase();
  const profileReady = !!profile?.username;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const renderItem = (item: any) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={(e) => item.disabled && e.preventDefault()}
        tabIndex={item.disabled ? -1 : 0}
        aria-disabled={item.disabled}
        className={`
          flex flex-col items-center justify-center
          text-[11px] transition-all
          ${item.disabled ? "opacity-40 pointer-events-none" : ""}
          ${active ? "text-fuchsia-600" : "text-gray-700"}
        `}
      >
        <div
          className={`
            p-2 rounded-xl transition-all duration-200
            ${
              active
                ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105"
                : "bg-white/50 backdrop-blur border border-white/30 hover:bg-white/70 hover:scale-105"
            }
          `}
        >
          {item.icon}
        </div>
        <span className={`mt-1 font-medium transition-all duration-200 ${active ? 'font-semibold' : ''}`}>{item.label}</span>
      </Link>
    );
  };

  const consumerItems = [
    { href: "/", icon: <Home size={22} />, label: "Home" },
    { href: "/search", icon: <Search size={22} />, label: "Search" },
    { href: "/favorites", icon: <Heart size={22} />, label: "Saved" },
    {
      href: profileReady ? `/${profile.username}` : "#",
      icon: <User size={22} />,
      label: "Profile",
      disabled: !profileReady,
    },
  ];

  if (role !== "creator") {
    return (
      <nav className="sticky bottom-0 z-50 backdrop-blur-2xl bg-white/40 border-t border-white/30 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3">
        <div className="grid grid-cols-4">{consumerItems.map(renderItem)}</div>
      </nav>
    );
  }

  // CREATOR MODE — 5 column layout with the middle used by the + button
  const creatorGrid = [
    { href: "/", icon: <Home size={22} />, label: "Home" },
    { href: "/sales", icon: <BarChart3 size={22} />, label: "Sales" },
    null, // middle slot for the + button
    { href: "/orders", icon: <Package size={22} />, label: "Orders" },
    {
      href: profileReady ? `/${profile.username}` : "#",
      icon: <User size={22} />,
      label: "Profile",
      disabled: !profileReady,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-50 backdrop-blur-2xl bg-white/40 border-t border-white/30 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3 relative">
      <div className="grid grid-cols-5 items-center text-center">
        {creatorGrid.map((item, i) =>
          item ? (
            <div key={i}>{renderItem(item)}</div>
          ) : (
            <div key={i} className="relative h-full"></div>
          )
        )}
      </div>

      {/* absolute center + button */}
      <Link
        href="/add"
        aria-label="Add listing"
        style={{ width: 72, height: 72 }}
        className="
          absolute left-1/2 -translate-x-1/2 -top-7
          rounded-full
          flex items-center justify-center
          bg-gradient-to-r from-fuchsia-600 to-pink-500
          text-white
          shadow-xl shadow-pink-500/40
          hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50
          active:scale-95
          transition-all duration-200
          backdrop-blur-xl
        "
      >
        <Plus size={34} strokeWidth={2.5} color={"white"} />
      </Link>
    </nav>
  );
});

export default AppNav;
