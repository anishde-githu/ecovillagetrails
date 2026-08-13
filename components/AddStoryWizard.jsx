// components/AddStoryWizard.jsx
// 3-step "Add Story" flow launched from the My Stories tab on /my-account:
//   1. Place basics (short answer + 2 multiple-choice)
//   2. Traveller's own words (2 long answers + 1 multiple-choice + 1 short answer)
//   3. Photos + AI-generated description (traveller picks AI text or their own
//      answers as the published description), then publish.
//
// Publishes to the same Firestore `posts` collection the homepage's
// Community Experiences carousel already reads (public/legacy/js/community-feed.js),
// with extra fields (`images`, `answers`, `aiDescription`, `usedAI`, `category`)
// so the homepage card + detail modal can show the full story.

"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  X,
  MapPin,
  Loader2,
  Sparkles,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

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
    throw new Error(errData?.error?.message || "Image upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

const CATEGORIES = ["Hills & mountains", "Village life", "Beach & coast", "Wildlife", "Heritage", "Other"];
const WHEN_OPTIONS = ["This month", "A few months ago", "Last year", "Longer ago"];
const RECOMMEND_OPTIONS = ["Yes, definitely", "Yes, with a few caveats", "Not really"];

const STEPS = ["The place", "Your story", "Photos & publish"];

export default function AddStoryWizard({ user, profile, onClose, onPublished }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    placeName: "",
    category: "",
    whenVisited: "",
    special: "",
    tips: "",
    recommend: "",
    bestTime: "",
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [descriptionChoice, setDescriptionChoice] = useState("ai"); // "ai" | "answers"
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const set = (key) => (e) => setAnswers((a) => ({ ...a, [key]: e.target.value }));
  const setChoice = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const step1Valid = answers.placeName.trim() && answers.category && answers.whenVisited;
  const step2Valid = answers.special.trim() && answers.recommend;

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []).slice(0, 6);
    if (!list.length) return;
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  const compiledFromAnswers = () => {
    const lines = [];
    lines.push(`📍 ${answers.placeName}${answers.category ? ` · ${answers.category}` : ""}${answers.whenVisited ? ` · visited ${answers.whenVisited}` : ""}`);
    if (answers.special) lines.push(`✨ What made it special: ${answers.special}`);
    if (answers.tips) lines.push(`💡 Tips for future travellers: ${answers.tips}`);
    if (answers.bestTime) lines.push(`🗓️ Best time to visit: ${answers.bestTime}`);
    if (answers.recommend) lines.push(`👍 Would recommend: ${answers.recommend}`);
    return lines.join("\n");
  };

  const generateAI = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setAiDescription(data.description);
        setDescriptionChoice("ai");
      } else {
        setAiError("Couldn't generate an AI description right now — you can still publish using your own answers.");
        setDescriptionChoice("answers");
      }
    } catch (err) {
      console.error(err);
      setAiError("Couldn't generate an AI description right now — you can still publish using your own answers.");
      setDescriptionChoice("answers");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!files.length) {
      setPublishError("Add at least one photo before publishing.");
      return;
    }
    setPublishing(true);
    setPublishError("");
    try {
      const imageUrls = [];
      for (const f of files) {
        // Sequential to keep it simple and give clear progress via the
        // spinner rather than firing 6 uploads at once.
        imageUrls.push(await uploadToCloudinary(f));
      }

      const finalDescription =
        descriptionChoice === "ai" && aiDescription ? aiDescription : compiledFromAnswers();

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: profile?.name || "Explorer",
        userPhoto: profile?.photoURL || "",
        location: answers.placeName,
        category: answers.category,
        imageURL: imageUrls[0],
        images: imageUrls,
        review: finalDescription,
        answers,
        aiDescription: aiDescription || null,
        usedAI: descriptionChoice === "ai" && !!aiDescription,
        createdAt: serverTimestamp(),
      });

      onPublished?.();
    } catch (err) {
      console.error("[AddStoryWizard] publish failed:", err);
      setPublishError("Something went wrong publishing your story. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4 py-8" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add your story</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-emerald-600" : "bg-gray-150 bg-gray-100"}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Which place did you visit?</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={answers.placeName}
                    onChange={set("placeName")}
                    placeholder="e.g. Kemdahari, West Bengal"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">What kind of place is it?</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <ChoiceChip key={c} label={c} active={answers.category === c} onClick={() => setChoice("category", c)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">When did you visit?</label>
                <div className="flex flex-wrap gap-2">
                  {WHEN_OPTIONS.map((w) => (
                    <ChoiceChip key={w} label={w} active={answers.whenVisited === w} onClick={() => setChoice("whenVisited", w)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">What made this place special?</label>
                <textarea
                  value={answers.special}
                  onChange={set("special")}
                  rows={4}
                  placeholder="The people, the food, a moment you won't forget..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Any tips for future travellers? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={answers.tips}
                  onChange={set("tips")}
                  rows={3}
                  placeholder="What to pack, how to get there, what to avoid..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Would you recommend it to others?</label>
                <div className="flex flex-wrap gap-2">
                  {RECOMMEND_OPTIONS.map((r) => (
                    <ChoiceChip key={r} label={r} active={answers.recommend === r} onClick={() => setChoice("recommend", r)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Best time to visit <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={answers.bestTime}
                  onChange={set("bestTime")}
                  placeholder="e.g. October to February"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Add photos <span className="text-gray-400 font-normal">(up to 6)</span></label>
                <label className="flex items-center gap-2 text-sm text-emerald-700 font-medium cursor-pointer border border-dashed border-emerald-300 rounded-xl px-4 py-3 w-fit hover:bg-emerald-50">
                  <ImagePlus className="w-4 h-4" />
                  {files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} selected` : "Choose photos"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                </label>
                {previews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {previews.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-800">Description for your story</label>
                  <button
                    type="button"
                    onClick={generateAI}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {aiDescription ? "Regenerate with AI" : "Generate with AI"}
                  </button>
                </div>

                {aiError && <p className="text-xs text-amber-600 mb-3">{aiError}</p>}

                <div className="space-y-3">
                  <DescriptionOption
                    active={descriptionChoice === "ai"}
                    disabled={!aiDescription}
                    onClick={() => aiDescription && setDescriptionChoice("ai")}
                    title="Use AI-written description"
                    body={aiDescription || "Tap \u201cGenerate with AI\u201d above to create one from your answers."}
                  />
                  <DescriptionOption
                    active={descriptionChoice === "answers"}
                    disabled={false}
                    onClick={() => setDescriptionChoice("answers")}
                    title="Use my own answers instead"
                    body={compiledFromAnswers()}
                  />
                </div>
              </div>

              {publishError && <p className="text-sm text-red-500">{publishError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 ? !step1Valid : !step2Valid}
              className="flex items-center gap-1 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || !files.length}
              className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-40"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Publish story
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3.5 py-2 rounded-full border transition ${
        active
          ? "bg-emerald-600 border-emerald-600 text-white font-medium"
          : "bg-white border-gray-300 text-gray-600 hover:border-emerald-400"
      }`}
    >
      {label}
    </button>
  );
}

function DescriptionOption({ active, disabled, onClick, title, body }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left border rounded-xl p-4 transition ${
        active ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500" : "border-gray-200 hover:border-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
            active ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
          }`}
        >
          {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </span>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-xs text-gray-500 whitespace-pre-line line-clamp-4 pl-6">{body}</p>
    </button>
  );
}
