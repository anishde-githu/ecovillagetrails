// ============================================================
// api/calendar-ai.js
// Vercel Serverless Function — any file inside a root /api folder
// is automatically deployed as an endpoint at that path, so this
// file becomes: POST https://your-domain.vercel.app/api/calendar-ai
// No Express, no app.listen() — Vercel handles the server for you.
// ============================================================

import { generateTravelReport } from '../lib/groqCalendar.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { date, eventName, location, eventType } = req.body;

    if (!date || !eventName || !location) {
      return res.status(400).json({
        success: false,
        error: 'date, eventName, and location are required fields.',
      });
    }

    const data = await generateTravelReport({ date, eventName, location, eventType });

    return res.status(200).json({ success: true, date, eventName, location, data });
  } catch (err) {
    console.error('[api/calendar-ai] error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong while generating your travel insights. Please try again.',
    });
  }
}
