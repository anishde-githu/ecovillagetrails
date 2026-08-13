// components/PostModal.jsx
// Full-view modal opened when a story card is clicked (My Stories tab, and
// conceptually mirrored by public/legacy/js/community-feed.js for the
// homepage carousel). Shows the full image gallery, the published
// description, and — for stories created via the Add Story wizard — the
// underlying Q&A breakdown. Older simple posts (single image, plain review,
// no `answers`) still render fine since every extra field is optional.

"use client";

import { X, MapPin, User, Sparkles, Tag } from "lucide-react";

export default function PostModal({ post, onClose }) {
  if (!post) return null;

  const images = Array.isArray(post.images) && post.images.length ? post.images : [post.imageURL];
  const answers = post.answers || null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center px-4 py-8"
      onClick={onClose} // click backdrop to close
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking card
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        <div className="overflow-y-auto">
          {/* Image gallery */}
          {images.length > 1 ? (
            <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory">
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${post.location} photo ${i + 1}`}
                  className="w-full flex-shrink-0 snap-start h-72 object-cover"
                />
              ))}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt={post.location} className="w-full h-72 object-cover" />
          )}
          {images.length > 1 && (
            <p className="text-center text-[11px] text-gray-400 py-1.5 bg-gray-50">
              Swipe for {images.length} photos
            </p>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              {post.userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.userPhoto} alt={post.userName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-700" />
                </div>
              )}
              <span className="font-medium text-gray-900">{post.userName}</span>
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {post.location}
              </p>
              {post.category && (
                <p className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> {post.category}
                </p>
              )}
              {post.usedAI && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI-assisted description
                </span>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{post.review}</p>

            {answers && (
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  In {post.userName?.split(" ")[0] || "their"} own words
                </h4>
                {answers.whenVisited && <QARow q="When did they visit?" a={answers.whenVisited} />}
                {answers.tips && <QARow q="Tips for future travellers" a={answers.tips} />}
                {answers.bestTime && <QARow q="Best time to visit" a={answers.bestTime} />}
                {answers.recommend && <QARow q="Would they recommend it?" a={answers.recommend} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QARow({ q, a }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{q}</p>
      <p className="text-sm text-gray-800 whitespace-pre-line">{a}</p>
    </div>
  );
}
