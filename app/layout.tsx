import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ST Global Forwarding | International Freight Forwarder, Dhaka",
  description:
    "ST Global Forwarding is a Bangladesh-owned international freight forwarder providing air freight, ocean freight, customs brokerage and door-to-door logistics from Dhaka and Chittagong.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
