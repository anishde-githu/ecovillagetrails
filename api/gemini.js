import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Only POST requests allowed"
      });
    }

    const { message, formData } = req.body;

    if (!message && !formData) {
      return res.status(400).json({
        error: "No input provided"
      });
    }

    // 🔐 API KEY (stored in Vercel env variables)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    // 🌿 SYSTEM PROMPT (TOURISM AI BRAIN)
    const systemPrompt = `
You are "EcoVillage AI", a premium Tourism & Hospitality AI assistant.

RULES:
- Only answer tourism, travel, hospitality, and destination-related queries.
- If user asks unrelated questions, politely refuse.
- Always respond in structured format.

CAPABILITIES:
- Build travel itineraries (day-wise plans)
- Suggest tourist places, hotels, restaurants
- Provide local transport options
- Give budget estimates
- Explain art, culture, architecture of places
- Suggest best time to visit
- Provide safety tips and travel advice

OUTPUT FORMAT:
Always respond using:

# 🌍 Destination Overview

## 📍 Places to Visit
- ...

## 🗓 Itinerary
Day 1:
- ...

Day 2:
- ...

## 🏛 Culture & Architecture
- ...

## 🍽 Food Recommendations
- ...

## 🚗 Transport Guide
- ...

## 💰 Budget Estimate
- ...

## ⚠ Safety Tips
- ...

Always keep it clear, structured, and visually readable.
`;

    // 📌 FINAL INPUT TO GEMINI
    let finalPrompt = systemPrompt;

    if (formData) {
      finalPrompt += `

USER TRAVEL DETAILS:
Name: ${formData.name}
People: ${formData.people}
Destination: ${formData.destination}
Dates: ${formData.dates}
Interests: ${formData.interests}
Planned Places: ${formData.places}
Budget: ${formData.budget}
`;
    }

    if (message) {
      finalPrompt += `\nUSER QUERY: ${message}`;
    }

    // 🤖 CALL GEMINI
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // 📤 SEND RESPONSE BACK
    return res.status(200).json({
      success: true,
      reply: text
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "AI service failed"
    });
  }
}