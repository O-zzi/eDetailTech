// Netlify Function: WhatsApp Cloud API webhook bridge
//
// GET  -> answers Meta's one-time verification handshake
// POST -> forwards every inbound Meta event to a Make webhook, untouched
//
// Deploy path: netlify/functions/whatsapp-webhook.js
// Deploy via Netlify CLI (not drag-and-drop) so the function bundler runs.
//
// Public URL once deployed: https://<your-site>.netlify.app/.netlify/functions/whatsapp-webhook

exports.handler = async (event) => {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
  const FORWARD_URL = process.env.MAKE_WEBHOOK_URL;

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge,
      };
    }
    return { statusCode: 403, body: 'Verification failed' };
  }

  if (event.httpMethod === 'POST') {
    try {
      await fetch(FORWARD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: event.body,
      });
    } catch (err) {
      console.error('Forward to Make failed:', err);
    }
    return { statusCode: 200, body: 'EVENT_RECEIVED' };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
