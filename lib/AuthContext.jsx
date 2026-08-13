// lib/AuthContext.jsx
// Wrap your app (in app/layout.jsx) with <AuthProvider> so any component
// can call useAuth() to get { user, profile, loading }.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext({ user: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on login, logout, and page load (session restore)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        if (firebaseUser) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            // First-time login (e.g. first Google sign-in) — create the user doc
            const newProfile = {
              name: firebaseUser.displayName || "New Explorer",
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || "",
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(snap.data());
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        // Without this catch, an error here (e.g. Firestore Database not yet
        // created in the Firebase console) would leave `loading` stuck true
        // forever, and every page gated on auth would hang on "Loading...".
        console.error("[EcoVillage auth] failed to load/create user profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
