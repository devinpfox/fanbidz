"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isProfileSettingsRoute = pathname === "/profile-settings";

  useEffect(() => {
    // 🚨 Stop everything until AuthContext finishes loading user + profile
    if (loading) return;

    // PUBLIC ROUTES ❇️
    if (isPublicRoute) return;

    // NOT LOGGED IN → redirect to /login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Profile completion is no longer enforced here
    // Users can access the app without a complete profile
    // Specific actions (e.g., buying) will redirect to profile-settings as needed
  }, [user, profile, loading, pathname, router]);

  // Loading state: render nothing to avoid flicker
  if (loading) return null;

  // Authenticated or public route: render app
  return <>{children}</>;
}
