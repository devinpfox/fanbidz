"use client";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth(); // Assuming AuthContext provides isLoading
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Only redirect if user is not logged in, not loading, and on a protected route
    if (!isLoading && !user && !isPublicRoute) {
      router.push("/login");
    }
  }, [user, isLoading, isPublicRoute, router]);

  // Show a basic loading state while authentication status is being determined
  if (isLoading) {
    return <div className="p-6 text-center text-gray-600">Loading authentication status...</div>;
  }

  // If user is not logged in and on a protected route, show a redirecting message
  if (!user && !isPublicRoute) {
    return <div className="p-6 text-center text-gray-600">Redirecting to login...</div>;
  }

  // If user is logged in or on a public route, render children
  return <>{children}</>;
}