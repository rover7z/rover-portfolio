import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ali Mohammed — Rover | Portfolio",
  description: "Photography, documentaries, applications and creative work by Ali Mohammed (Rover).",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
