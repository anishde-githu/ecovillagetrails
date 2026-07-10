import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }

  try {
    const { message, formData } = req.body;

    const systemPrompt = `
You are EcoVillage AI, a premium Sustainable Rural Tourism & Hospitality planning assistant.

Rules:
- Only answer tourism, travel, hospitality and eco-village related questions. Politely refuse unrelated questions.
- Always respond in clean Markdown with clear headings (##), sub-headings, and bullet points.
- Recommend real-sounding destinations, homestays/eco-resorts, and local eateries where possible, and mention contact/website details if you can reasonably infer them.
- Make every place name a clickable Google Maps search link, formatted as: [Place Name](https://www.google.com/maps/search/?api=1&query=PLACE+NAME+CITY)
- Give a detailed day-wise itinerary matched to the traveller's requested number of days.
- Give a realistic budget breakdown (per day and total) matched to the traveller's selected budget tier and local price levels.
- Weave in the traveller's activity choices, interests, food preference, accessibility needs and fitness level throughout the plan.
- Keep tone professional, warm, and easy to read. No walls of unbroken text.
`;

    let userPrompt = "";

    if (formData) {
      // formData is the full travellerData object collected by the
      // 6-step AI Planner wizard on the frontend.
      const p = formData.personal || {};
      const t = formData.trip || {};
      const b = formData.budget || {};
      const activities = Array.isArray(formData.activities) ? formData.activities : [];
      const i = formData.interests || {};
      const q = formData.aiQuestions || {};

      const asList = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : "None specified");

      userPrompt = `
Generate a complete, professional, personalized Sustainable Rural Tourism report for the traveller below.
Use the following structure, in this exact order, with a Markdown "##" heading for each numbered section:

1. Executive Summary
2. Traveller Profile
3. Best EcoVillage Destination(s)
4. Why These Destinations Were Selected
5. Day-wise Itinerary
6. Accommodation Recommendation
7. Food Recommendations
8. Local Experiences
9. Budget Breakdown
10. Packing Checklist
11. Sustainability Impact
12. Carbon Footprint Estimate
13. Safety & Local Etiquette
14. Emergency Tips
15. Final Personalized Recommendations

--- TRAVELLER INFORMATION ---
Full Name: ${p.fullName || "N/A"}
Email: ${p.email || "N/A"}
Mobile: ${p.mobile || "N/A"}
Age Group: ${p.ageGroup || "N/A"}
Nationality: ${p.nationality || "N/A"}

--- TRIP DETAILS ---
Destination: ${t.destination || "N/A"}
Starting City: ${t.startingCity || "N/A"}
Travel Date: ${t.travelDate || "N/A"}
Return Date: ${t.returnDate || "N/A"}
Number of Days: ${t.days || "N/A"}
Total Travellers: ${t.travellers || "N/A"} (Adults: ${t.adults || 0}, Children: ${t.children || 0}, Senior Citizens: ${t.seniors || 0})
Preferred Transport: ${t.transport || "N/A"}

--- BUDGET & STAY ---
Budget Tier: ${b.budget || "N/A"}
Accommodation Type: ${b.accommodation || "N/A"}
Food Preference: ${b.food || "N/A"}
Accessibility Needs: ${b.accessibility || "None"}
Fitness Level: ${b.fitness || "N/A"}

--- ACTIVITIES SELECTED ---
${asList(activities)}

--- INTERESTS ---
Eco Interest Level (1-5): ${i.ecoInterest || "N/A"}
Weather Preference: ${i.weather || "N/A"}
Daily Schedule Pace: ${i.schedule || "N/A"}
Photography Interests: ${asList(i.photography)}
Travel Interests: ${asList(i.travelInterests)}

--- IN THEIR OWN WORDS ---
Ideal Vacation: ${q.idealVacation || "N/A"}
Most Wanted Experience: ${q.topExperience || "N/A"}
Visited an Eco Village Before: ${q.visitedBefore || "Not mentioned"}
Wants to Avoid: ${q.avoid || "Not mentioned"}
Special Requests: ${q.specialRequests || "None"}

Produce the full 15-section report now, well-formatted and ready to read.
`;
    } else {
      userPrompt = message;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      reply: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}