// ============================================================
// groqService.js
// Handles all communication with the Groq AI API.
// Keeps the raw HTTP/SDK logic isolated from route/controller logic.
// ============================================================

import Groq from 'groq-sdk';

// Groq client is initialized once using the API key from environment variables.
// Never hardcode the key — always pull it from process.env (see .env.example).
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model can be overridden via env var so it's easy to swap without touching code.
// llama-3.3-70b-versatile is a solid general-purpose Groq model for this kind of
// long-form, structured JSON generation task.
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Sends a prompt to Groq and returns the raw text response.
 * @param {string} systemPrompt - Instructions that define the AI's role/behavior.
 * @param {string} userPrompt - The actual request (date, location, event, etc).
 * @param {number} maxTokens - Max tokens to generate (large because we ask for a lot of structured content).
 * @returns {Promise<string>} raw text content returned by the model
 */
async function callGroq(systemPrompt, userPrompt, maxTokens = 4096) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      // Groq supports a JSON mode on many models — this strongly encourages
      // clean JSON output and avoids markdown code fences most of the time.
      response_format: { type: 'json_object' },
    });

    const content = completion?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq API returned an empty response.');
    }

    return content;
  } catch (err) {
    // Bubble up a clean error message; the controller decides how to respond to the client.
    console.error('[groqService] Groq API call failed:', err.message);
    throw new Error(`Groq API request failed: ${err.message}`);
  }
}

export { callGroq };