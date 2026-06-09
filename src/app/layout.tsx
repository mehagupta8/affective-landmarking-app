import type { Metadata } from "next";
import { Libre_Caslon_Text } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-caslon",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Affective Landmarking",
  description: "A space to feel literature, slowly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${libreCaslon.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[#2A2622] font-serif" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
