"use client";

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

export default function AppNav() {
  const pathname = usePathname();
  const { profile, loading } = useAuth() || {};

  if (loading) return null;

  const role = (profile?.role ?? "consumer").toLowerCase();
  const profileReady = !!profile?.username;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const consumerItems = [
    { href: "/", icon: <Home size={24} />, label: "Home" },
    { href: "/search", icon: <Search size={24} />, label: "Search" },
    { href: "/favorites", icon: <Heart size={24} />, label: "Saved" },
    {
      href: profileReady ? `/${profile!.username}` : "#",
      icon: <User size={24} />,
      label: "Profile",
      disabled: !profileReady,
    },
  ];

  const creatorItems = [
    { href: "/", icon: <Home size={24} />, label: "Home" },
    { href: "/sales", icon: <BarChart3 size={24} />, label: "Sales" },
    { href: "/orders", icon: <Package size={24} />, label: "Orders" },
    {
      href: profileReady ? `/${profile!.username}` : "#",
      icon: <User size={24} />,
      label: "Profile",
      disabled: !profileReady,
    },
  ];

  const items = role === "creator" ? creatorItems : consumerItems;
  const showCenterAdd = role === "creator";

  return (
    <nav className="sticky bottom-0 z-50 border-t bg-white flex justify-between items-center px-4 py-2 relative">
      <div className="flex justify-between w-full">
        {items.map((item) => {
          const isItemActive = isActive(item.href);
          return (
            <Link
            key={item.label}
            href={item.href}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={`flex flex-col items-center text-xs flex-1 transition-colors duration-200 ${
              isItemActive ? "text-brand" : "text-black"
            } ${item.disabled ? "opacity-50 pointer-events-none" : ""}`}
            tabIndex={item.disabled ? -1 : 0}
            aria-disabled={item.disabled}
          >
            {item.icon}
            <span className="text-[11px]">{item.label}</span>
          </Link>
          );
        })}
      </div>

      {showCenterAdd && (
        <Link
          href="/add"
          className="nav-add-button absolute left-1/2 -translate-x-1/2 -top-6 rounded-full flex flex-col items-center justify-center shadow-lg"
          style={{ width: 64, height: 64 }}
          aria-label="Add listing"
        >
          <Plus size={32} />
        </Link>
      )}
    </nav>
  );
}
