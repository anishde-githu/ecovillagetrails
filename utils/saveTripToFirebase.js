// utils/saveTripToFirebase.js
//
// Call this immediately after your AI Calendar/Planner finishes generating a plan.
// It saves the ENTIRE structured output — budget breakdown, day-wise itinerary,
// hotel suggestions, activity cards, feed cards, images — exactly as generated,
// so TripDetail.jsx can re-render it pixel-for-pixel later with zero data loss.
//
// Usage:
//   import { saveTripToFirebase } from "@/utils/saveTripToFirebase";
//
//   const tripId = await saveTripToFirebase(userId, aiOutput);
//
// `aiOutput` shape expected (adapt keys to match your AI planner's real output —
// the important thing is we store whatever it returns, unmodified, in the fields below):
// {
//   title, destination, startDate, endDate, totalBudget,
//   budgetBreakdown: [...], dayWiseItinerary: [...],
//   hotelSuggestions: [...], activityCards: [...], feedCards: [...], images: [...]
// }

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function saveTripToFirebase(userId, aiOutput) {
  if (!userId) {
    throw new Error("saveTripToFirebase: userId is required (user must be logged in).");
  }
  if (!aiOutput || typeof aiOutput !== "object") {
    throw new Error("saveTripToFirebase: aiOutput must be the full AI-generated trip object.");
  }

  // Defensive defaults so a partial AI response never throws — we'd rather save
  // an incomplete trip than lose the whole thing.
  const tripDoc = {
    userId,
    title: aiOutput.title ?? "Untitled Trip",
    destination: aiOutput.destination ?? "",
    startDate: aiOutput.startDate ?? null,
    endDate: aiOutput.endDate ?? null,
    totalBudget: aiOutput.totalBudget ?? 0,

    // Full nested structures preserved AS-IS — these are arrays of objects
    // (Firestore supports arbitrarily nested arrays/maps within a document,
    // so no flattening or transformation is needed).
    budgetBreakdown: aiOutput.budgetBreakdown ?? [],
    dayWiseItinerary: aiOutput.dayWiseItinerary ?? [],
    hotelSuggestions: aiOutput.hotelSuggestions ?? [],
    activityCards: aiOutput.activityCards ?? [],
    feedCards: aiOutput.feedCards ?? [],
    images: aiOutput.images ?? [],

    // Keep the raw, un-normalized AI response too, as a safety net — if the
    // planner's schema evolves later, TripDetail can fall back to this blob
    // without any data ever being unrecoverable.
    rawAiResponse: aiOutput,

    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "trips"), tripDoc);
  return docRef.id;
}

// Firestore documents are capped at 1MB. Long AI itineraries with many
// embedded base64 images can exceed that — use this helper BEFORE saving
// to catch it early with a clear error instead of a cryptic Firestore failure.
export function estimateTripSizeBytes(aiOutput) {
  return new Blob([JSON.stringify(aiOutput)]).size;
}

export const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576; // 1 MiB
