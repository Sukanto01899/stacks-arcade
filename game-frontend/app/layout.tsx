import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = Space_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Stacks Arcade",
  description: "Frontend control room for Stacks mini-games, wallet actions, and on-chain reads.",
  other: {
    "talentapp:project_verification":
      "fa36e2003afb3780c36609a910b9adb8bb27d648c83ec1ca1e39b032bb02f85f1dd5829d451e873733104da2c2039a523989e9ea221ded82a8ea197df0b0cd28",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
