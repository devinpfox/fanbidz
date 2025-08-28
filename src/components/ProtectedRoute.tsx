"use client";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); // use loading (not isLoading)
  const router = useRouter();
  const pathname = usePathname();

  // Any route in here will be accessible without login
  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Only redirect after loading is finished
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, isPublicRoute, router]);

  // While checking auth status
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading authentication status...
      </div>
    );
  }

  // If not logged in and on a protected route, show redirecting message
  if (!user && !isPublicRoute) {
    return (
      <div className="p-6 text-center text-gray-600">
        Redirecting to login...
      </div>
    );
  }

  // If logged in OR on a public route, render children
  return <>{children}</>;
}
