// app/layout.jsx
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export const metadata = {
  title: "EcoVillage Trails",
  description: "Community-run eco-tourism stays, guides, and villages across India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          {/* Bottom padding so content isn't hidden behind the floating mobile nav */}
          <div className="md:hidden h-20" />
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
