// components/MyAccount.jsx
// /my-account page content: 3 tabs — Profile, My Stories, My Trips.
// Redirects to /login if not authenticated (handled in app/my-account/page.jsx wrapper).
//
// Image uploads (profile pictures, story photos) go through Cloudinary
// instead of Firebase Storage — fill in your own cloud name and unsigned
// upload preset below. Firebase Storage requires the Blaze plan as of Oct
// 2024; this avoids needing it.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { User, MapPin, Loader2, Calendar, IndianRupee, Plus, BookOpen, Home, LogOut, Compass } from "lucide-react";
import TripDetail from "./TripDetail";
import AddStoryWizard from "./AddStoryWizard";
import PostModal from "./PostModal";
import SpotlightCard from "./reactbits/SpotlightCard";
import SplitText from "./reactbits/SplitText";
import Dock from "./reactbits/Dock";

// --- Fill these in from your Cloudinary dashboard ---
// Cloud name: Dashboard home page.
// Upload preset: Settings → Upload → Upload presets → Add upload preset →
// Signing Mode = "Unsigned" → copy its name here.
const CLOUDINARY_CLOUD_NAME = "dz7fem9du";
const CLOUDINARY_UPLOAD_PRESET = "ecovlllagetrails";

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

const TABS = ["Profile", "My Stories", "My Trips"];
const TAB_ICONS = { Profile: "👤", "My Stories": "📖", "My Trips": "✈️" };

export default function MyAccount() {
  const { user, profile, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [autoOpenWizard, setAutoOpenWizard] = useState(false);
  const router = useRouter();

  if (!user) return null; // guarded by parent page

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/legacy/index.html");
  };

  const dockItems = [
    {
      key: "home",
      label: "Home",
      icon: <Home className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />,
      onClick: () => router.push("/legacy/index.html"),
    },
    {
      key: "explore",
      label: "Explore",
      icon: <Compass className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />,
      onClick: () => router.push("/legacy/index.html#destinations"),
    },
    {
      key: "add-story",
      label: "Add story",
      icon: <Plus className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />,
      onClick: () => {
        setActiveTab("My Stories");
        setAutoOpenWizard(true);
      },
    },
    {
      key: "profile",
      label: "Profile",
      icon: <User className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />,
      onClick: () => setActiveTab("Profile"),
    },
    {
      key: "logout",
      label: "Log out",
      icon: <LogOut className="w-[18px] h-[18px] text-red-500" strokeWidth={2} />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
      {/* Profile header — glass card with cursor-tracking spotlight */}
      <SpotlightCard
        spotlightColor="rgba(255,255,255,0.25)"
        className="flex items-center gap-5 mb-8 bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-6 shadow-xl"
      >
        {profile?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoURL}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-white/60 shadow-lg relative z-10"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center relative z-10">
            <User className="w-9 h-9 text-white" />
          </div>
        )}
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {profile?.name || "Explorer"} <span>🌿</span>
          </h1>
          <p className="text-emerald-50/80 text-sm">{profile?.email}</p>
        </div>
      </SpotlightCard>

      {/* Desktop-only quick-actions Dock — deliberately scoped to this page only
          (per spec: on desktop the magnifying dock lives here, nowhere else;
          on mobile the site-wide MobileNav/mobile-dock.js already covers this
          page along with every other page, so no duplicate dock renders here). */}
      <Dock items={dockItems} className="mb-6" />

      {/* Tabs — glass pill bar */}
      <div className="flex gap-2 mb-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition flex items-center gap-1.5 ${
              activeTab === tab
                ? "bg-white text-emerald-700 shadow-md"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <span>{TAB_ICONS[tab]}</span> {tab}
          </button>
        ))}
      </div>

      {/* Tab content — glass card */}
      <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {activeTab === "Profile" && (
          <ProfileTab user={user} profile={profile} setProfile={setProfile} />
        )}
        {activeTab === "My Stories" && (
          <MyStoriesTab
            user={user}
            profile={profile}
            autoOpenWizard={autoOpenWizard}
            onAutoOpenHandled={() => setAutoOpenWizard(false)}
          />
        )}
        {activeTab === "My Trips" && <MyTripsTab user={user} />}
      </div>
    </div>
  );
}

/* ---------------------------------- Profile tab ---------------------------------- */

function ProfileTab({ user, profile, setProfile }) {
  const [name, setName] = useState(profile?.name || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(profile?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      let photoURL = profile?.photoURL || "";

      if (file) {
        photoURL = await uploadToCloudinary(file);
      }

      const updated = { name, photoURL };
      await updateDoc(doc(db, "users", user.uid), updated);
      setProfile((prev) => ({ ...prev, ...updated }));
      setSavedMsg("Profile updated.");
    } catch (err) {
      console.error(err);
      setSavedMsg("Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-5">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-20 h-20 rounded-full object-cover border" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-700" />
          </div>
        )}
        <label className="text-sm text-emerald-700 font-medium cursor-pointer hover:underline">
          Change photo
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          value={profile?.email || ""}
          disabled
          className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save changes
      </button>
      {savedMsg && <p className="text-sm text-gray-500">{savedMsg}</p>}
    </div>
  );
}

/* ---------------------------------- My Stories tab --------------------------------- */

function MyStoriesTab({ user, profile, autoOpenWizard, onAutoOpenHandled }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (autoOpenWizard) {
      setShowWizard(true);
      onAutoOpenHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenWizard]);

  const loadMyPosts = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const q = query(
        collection(db, "posts"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("[EcoVillage] Failed to load stories:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <SplitText text="Your stories" splitType="words" delay={60} duration={400} />
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Published stories appear on the homepage for other travellers to discover.
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add story
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading your stories...</p>
      ) : loadError ? (
        <p className="text-red-500 text-sm">
          Couldn't load your stories. Check the browser console for the exact error — this usually
          means a Firestore composite index needs to be created (Firestore will show a link to
          create it automatically the first time this query runs).
        </p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl py-12 text-center">
          <p className="text-gray-400 text-sm mb-3">You haven't published a story yet.</p>
          <button
            onClick={() => setShowWizard(true)}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            Share your first trip →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {posts.map((post) => (
            <SpotlightCard
              key={post.id}
              as="button"
              onClick={() => setSelectedPost(post)}
              spotlightColor="rgba(16,185,129,0.28)"
              className="text-left rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition"
            >
              <div className="relative z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageURL} alt={post.location} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {post.location}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 whitespace-pre-line">{post.review}</p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}

      {showWizard && (
        <AddStoryWizard
          user={user}
          profile={profile}
          onClose={() => setShowWizard(false)}
          onPublished={() => {
            setShowWizard(false);
            loadMyPosts();
          }}
        />
      )}

      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}

/* --------------------------------- My Trips tab ----------------------------------- */

function MyTripsTab({ user }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const q = query(
          collection(db, "trips"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("[EcoVillage] Failed to load trips:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.uid]);

  if (loading) return <p className="text-gray-400 text-sm">Loading your trips...</p>;
  if (loadError)
    return (
      <p className="text-red-500 text-sm">
        Couldn't load your trips. Check the browser console for the exact error — this usually
        means a Firestore composite index needs to be created.
      </p>
    );
  if (trips.length === 0)
    return <p className="text-gray-400 text-sm">No AI-generated trips saved yet.</p>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <SpotlightCard
            key={trip.id}
            as="button"
            onClick={() => setSelectedTrip(trip)}
            spotlightColor="rgba(16,185,129,0.24)"
            className="text-left border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
          >
            <div className="relative z-10">
              <h3 className="font-semibold text-gray-900">{trip.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{trip.destination}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {trip.totalBudget?.toLocaleString?.() || trip.totalBudget}
                </span>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {selectedTrip && (
        <TripDetail trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return value;
  }
}
