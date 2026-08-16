// components/Navbar.jsx
// Desktop/top navbar. Shows "Login" when logged out, "My Account" + avatar when logged in.

"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  return (
    <nav className="hidden sm:flex w-full items-center justify-between px-6 py-4 bg-white/90 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
      <Link href="/legacy/index.html" className="text-lg font-bold text-emerald-700">
        EcoVillage Trails
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/legacy/index.html#destinations" className="text-sm text-gray-600 hover:text-emerald-700 hidden md:inline">
          Destinations
        </Link>
        <Link href="/legacy/index.html#planner" className="text-sm text-gray-600 hover:text-emerald-700 hidden md:inline">
          AI Planner
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-700"
            >
              {profile?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoURL}
                  alt={profile?.name || "avatar"}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-700" />
                </div>
              )}
              <span className="hidden sm:inline">My Account</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2">
                <Link
                  href="/my-account"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
