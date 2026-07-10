// Sends an instant Telegram message to your phone whenever a partner
// (hotel/agent/guide) submits a listing for approval.
//
// SETUP (one-time, ~2 minutes):
// 1. Open Telegram, search for "BotFather", send it /newbot, follow the
//    prompts. It gives you a token like 123456:ABC-DEF... -> put that in
//    .env as TELEGRAM_BOT_TOKEN
// 2. Search for "userinfobot" in Telegram, send it any message, it replies
//    with your numeric chat ID -> put that in .env as TELEGRAM_CHAT_ID
// 3. IMPORTANT: open a chat with your OWN new bot and send it any message
//    first (e.g. "hi") — Telegram bots can't message you until you've
//    messaged them at least once.
// That's it — no paid service, no app to install, just Telegram itself.

const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing) — skipping notification.');
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Telegram notification failed:', res.status, body);
    }
  } catch (err) {
    // Never let a notification failure break the actual API request
    console.error('Telegram notification error:', err.message);
  }
}

export function notifyNewListingSubmitted(listing, ownerUser) {
  const categoryLabel = { hotel: 'Hotel', agent: 'Travel Agent', guide: 'Local Guide' }[listing.category] || listing.category;
  const text =
    `🌿 <b>New ${categoryLabel} listing awaiting approval</b>\n\n` +
    `<b>${escapeHtml(listing.name)}</b>\n` +
    `Region: ${escapeHtml(listing.region)}\n` +
    `Submitted by: ${escapeHtml(ownerUser.name)} (${escapeHtml(ownerUser.email)})\n\n` +
    `Open your admin panel to approve or reject it.`;
  return sendTelegramMessage(text);
}

export function notifyListingEdited(listing, ownerUser) {
  const categoryLabel = { hotel: 'Hotel', agent: 'Travel Agent', guide: 'Local Guide' }[listing.category] || listing.category;
  const text =
    `✏️ <b>${categoryLabel} listing edited — re-review needed</b>\n\n` +
    `<b>${escapeHtml(listing.name)}</b>\n` +
    `By: ${escapeHtml(ownerUser.name)} (${escapeHtml(ownerUser.email)})`;
  return sendTelegramMessage(text);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
