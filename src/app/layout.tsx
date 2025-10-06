// app/layout.tsx
import "./globals.css";
import localFont from "next/font/local";
import type { Metadata } from "next";

import SupabaseProvider from "./supabase-provider";
import { ListingProvider } from "@/context/ListingContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppNav from "@/components/AppNav";

const montserrat = localFont({
  src: [
    {
      path: "../fonts/Montserrat-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/Montserrat-Italic-VariableFont_wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-montserrat",
});


export const metadata: Metadata = {
  other: { "color-scheme": "light" }, // avoid auto dark flips
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        <SupabaseProvider>
          <AuthProvider>
            <ListingProvider>
              <main className="flex-1">
                <ProtectedRoute>{children}</ProtectedRoute>
              </main>
              <AppNav />
            </ListingProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
