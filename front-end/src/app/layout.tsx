import type { Metadata } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
import "./globals.css";

const fontBody = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["200", "300", "400", "600", "700", "800", "900"]
});

const fontDisplay = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "Polaris Chat",
  description: "Streaming chatbot UI"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}

