// components/TripDetail.jsx
// Full-screen modal that renders a saved trip EXACTLY as it was AI-generated —
// budget cards, day-wise itinerary, hotel suggestions, activity cards, feed cards, images.
// Reads straight from the Firestore `trips/{tripId}` doc shape written by
// utils/saveTripToFirebase.js — nothing is recomputed or reformatted, only displayed.

"use client";

import { X, Calendar, IndianRupee, Hotel, MapPin, Sparkles } from "lucide-react";

export default function TripDetail({ trip, onClose }) {
  if (!trip) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{trip.title}</h2>
          <p className="text-gray-500">{trip.destination}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <IndianRupee className="w-4 h-4" />
              Total: {trip.totalBudget?.toLocaleString?.() ?? trip.totalBudget}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Images */}
          {trip.images?.length > 0 && (
            <section>
              <div className="grid grid-cols-3 gap-2">
                {trip.images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Trip image ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>
            </section>
          )}

          {/* Budget breakdown */}
          {trip.budgetBreakdown?.length > 0 && (
            <Section title="Budget Breakdown" icon={IndianRupee}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trip.budgetBreakdown.map((item, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{item.category || item.label}</p>
                    <p className="font-semibold text-gray-900">
                      ₹{item.amount?.toLocaleString?.() ?? item.amount}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Day-wise itinerary */}
          {trip.dayWiseItinerary?.length > 0 && (
            <Section title="Day-wise Itinerary" icon={Calendar}>
              <div className="space-y-4">
                {trip.dayWiseItinerary.map((day, i) => (
                  <div key={i} className="border-l-2 border-emerald-500 pl-4">
                    <p className="font-medium text-gray-900">
                      Day {day.day ?? i + 1}
                      {day.title ? ` — ${day.title}` : ""}
                    </p>
                    {Array.isArray(day.activities) ? (
                      <ul className="text-sm text-gray-600 list-disc list-inside mt-1 space-y-0.5">
                        {day.activities.map((act, j) => (
                          <li key={j}>{typeof act === "string" ? act : act.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Hotel suggestions */}
          {trip.hotelSuggestions?.length > 0 && (
            <Section title="Hotel Suggestions" icon={Hotel}>
              <div className="grid sm:grid-cols-2 gap-3">
                {trip.hotelSuggestions.map((hotel, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <p className="font-medium text-gray-900">{hotel.name}</p>
                    {hotel.pricePerNight && (
                      <p className="text-sm text-emerald-700">₹{hotel.pricePerNight}/night</p>
                    )}
                    {hotel.description && (
                      <p className="text-xs text-gray-500 mt-1">{hotel.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Activity cards */}
          {trip.activityCards?.length > 0 && (
            <Section title="Activities" icon={MapPin}>
              <div className="grid sm:grid-cols-2 gap-3">
                {trip.activityCards.map((activity, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <p className="font-medium text-gray-900">{activity.name || activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Feed / suggestion cards */}
          {trip.feedCards?.length > 0 && (
            <Section title="Suggestions" icon={Sparkles}>
              <div className="grid sm:grid-cols-2 gap-3">
                {trip.feedCards.map((card, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <p className="font-medium text-gray-900">{card.title}</p>
                    {card.description && (
                      <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Fallback: trips saved from the original report.html AI Planner
              wizard only have a raw markdown report (no structured cards
              above), since that flow generates free-form text, not JSON.
              Show it in full rather than silently losing the plan. */}
          {!hasAnyStructuredData(trip) && trip.rawMarkdown && (
            <Section title="Full AI-Generated Report" icon={Sparkles}>
              <div className="border border-gray-200 rounded-xl p-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {trip.rawMarkdown}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function hasAnyStructuredData(trip) {
  return (
    trip.budgetBreakdown?.length > 0 ||
    trip.dayWiseItinerary?.length > 0 ||
    trip.hotelSuggestions?.length > 0 ||
    trip.activityCards?.length > 0 ||
    trip.feedCards?.length > 0
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
        <Icon className="w-4 h-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return value;
  }
}
