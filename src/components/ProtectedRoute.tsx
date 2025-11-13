"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, isPublicRoute, router]);

  // ✅ render immediately if user exists (even if loading)
  if (user || isPublicRoute) {
    return <>{children}</>;
  }

  // ✅ while loading, render nothing (don’t block)
  if (loading) return null;

  // ✅ if not logged in and on protected route, redirecting message (optional)
  return (
    <div className="p-6 text-center text-gray-600">
      Redirecting to login...
    </div>
  );
}
