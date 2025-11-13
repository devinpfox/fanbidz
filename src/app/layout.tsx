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
  title: "JustBidz",
  description: "The auction platform for creators.",
  other: { "color-scheme": "light" },

  // ✅ Open Graph (Facebook, iMessage, Discord)
  openGraph: {
    title: "Fanbids",
    description: "Bid, buy, and sell with creators.",
    url: "http://fanbidz.vercel.app/",
    siteName: "JustBidz",
    images: [
      {
        url: "/social-preview.png", // <-- put your 1920x1080 image here
        width: 1920,
        height: 1080,
        alt: "JustBidz Preview",
      },
    ],
    type: "website",
  },

  // ✅ Twitter Card (X)
  twitter: {
    card: "summary_large_image",
    title: "JustBidz",
    description: "Bid, buy, and sell with creators.",
    images: ["/social-preview.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}
