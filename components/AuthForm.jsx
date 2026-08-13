// components/AuthForm.jsx
// The /login and /signup pages. Deliberately matches the glassmorphism
// login gate shown on the homepage (public/legacy/js/site-gate.js) — same
// video background, same green frosted-glass panel, same brand copy — so
// visitors see one consistent login experience everywhere "Login" appears,
// instead of two different-looking screens.
//
// `defaultMode` = "login" | "signup"

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";

export default function AuthForm({ defaultMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name,
          email,
          photoURL: "",
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/legacy/index.html");
    } catch (err) {
      console.error("[EcoVillage auth] email/password error:", err);
      setError(friendlyError(err.code) + (err.code ? ` (${err.code})` : ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/legacy/index.html");
    } catch (err) {
      console.error("[EcoVillage auth] google error:", err);
      setError(friendlyError(err.code) + (err.code ? ` (${err.code})` : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-emerald-900">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/legacy/assets/coverved.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-emerald-900/75 to-emerald-800/70" />

      <div className="relative z-10 w-[min(920px,92vw)] max-h-[88vh] overflow-auto grid grid-cols-1 md:grid-cols-2 bg-white/10 backdrop-blur-2xl border border-white/25 rounded-3xl shadow-2xl">
        {/* LEFT: brand */}
        <div className="p-9 sm:p-10 flex flex-col justify-center text-white border-b md:border-b-0 md:border-r border-white/15">
          <h1 className="text-3xl font-extrabold leading-tight mb-3.5">
            🌿 EcoVillage
            <br />
            Trails
          </h1>
          <p className="text-sm leading-relaxed text-white/90 mb-4">
            Real villages. Real families. Real impact — every stay here directly supports the
            communities you visit, not a hotel chain.
          </p>
          <ul className="text-[13.5px] leading-loose text-white/95 space-y-0.5">
            <li>🌱 12+ partner villages across Bengal &amp; beyond</li>
            <li>🏡 340+ host families welcoming travellers</li>
            <li>♻️ 100% renewable-powered stays</li>
          </ul>
        </div>

        {/* RIGHT: form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <h2 className="text-white text-xl font-bold mb-1.5">
            {isSignup ? "Create your account" : "Log in to continue"}
          </h2>
          <p className="text-white/75 text-[13px] mb-5">
            One account gets you the AI planner, your saved trips, and the community feed.
          </p>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white/95 hover:bg-white rounded-xl py-3 font-semibold text-sm text-gray-800 transition disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4.5 my-5">
            <div className="h-px bg-white/25 flex-1" />
            <span className="text-[11px] text-white/60 uppercase tracking-wide">or</span>
            <div className="h-px bg-white/25 flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignup && (
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder-white/60 text-sm outline-none focus:border-emerald-300 focus:bg-white/15 transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder-white/60 text-sm outline-none focus:border-emerald-300 focus:bg-white/15 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder-white/60 text-sm outline-none focus:border-emerald-300 focus:bg-white/15 transition"
              />
            </div>

            {error && <p className="text-[12.5px] text-red-200">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-50 mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="text-[13px] text-white/75 mt-4.5 mt-5 text-center">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <button
              onClick={() => setMode(isSignup ? "login" : "signup")}
              className="text-emerald-300 font-semibold hover:underline"
            >
              {isSignup ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/configuration-not-found": "Sign-in isn't set up yet — contact the site owner.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.6 8.6 0 009 0 9 9 0 00.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
