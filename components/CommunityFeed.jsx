// components/CommunityFeed.jsx
// Homepage section: "Community Experiences" — fetches latest 10 posts from Firestore,
// renders as a horizontal auto-scrolling/looping carousel. Click a card to open PostModal.
// Place this directly above your News section in the homepage layout.

"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, User } from "lucide-react";
import PostModal from "./PostModal";

export default function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  // Gentle continuous auto-scroll, looping back to start when it reaches the end.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || posts.length === 0) return;

    const interval = setInterval(() => {
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [posts]);

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <section id="community" className="py-14 px-4 sm:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Experiences</h2>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="snap-start shrink-0 w-64 text-left border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageURL} alt={post.location} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {post.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.userPhoto} alt={post.userName} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-emerald-700" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-800">{post.userName}</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" /> {post.location}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">{post.review}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </section>
  );
}
