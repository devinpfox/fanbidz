// app/layout.tsx
import "./globals.css";
import localFont from "next/font/local";

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

export const metadata = {
  other: { "color-scheme": "light" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}
