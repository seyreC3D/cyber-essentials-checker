// API Proxy for Claude — keeps the API key server-side.
//
// DEPLOYMENT OPTIONS:
//
// 1) Vercel Serverless Function
//    - Place this file at api/analyze.js in your project root.
//    - Set the ANTHROPIC_API_KEY environment variable in Vercel dashboard.
//    - Deploy with `vercel deploy`.
//
// 2) Netlify Function
//    - Rename to netlify/functions/analyze.js and adjust exports.
//
// 3) Firebase Cloud Function
//    - See api/firebase-function.js for a ready-made wrapper.
//
// 4) Any Node.js host (Express, etc.)
//    - Import the handler below and wire it to a POST route.

module.exports = async function handler(req, res) {
    // Allow GET for health-check / debugging
    if (req.method === 'GET') {
        return res.status(200).json({ ok: true, message: 'API proxy is running. Send a POST to use it.' });
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }

    const { prompt, systemPrompt, max_tokens, model, temperature } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "prompt" in request body.' });
    }

    // Limit prompt length to prevent abuse
    if (prompt.length > 50000) {
        return res.status(400).json({ error: 'Prompt too long.' });
    }

    // Validate systemPrompt if provided
    const system = (typeof systemPrompt === 'string' && systemPrompt.length <= 10000)
        ? systemPrompt
        : '';

    // Allow client to request a specific model (whitelist only)
    const allowedModels = ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'];
    const resolvedModel = allowedModels.includes(model) ? model : 'claude-sonnet-4-5-20250929';

    // Allow client to set max_tokens (capped between 100 and 4000)
    const resolvedMaxTokens = (typeof max_tokens === 'number' && max_tokens >= 100 && max_tokens <= 4000)
        ? max_tokens
        : 4000;

    // Allow client to set temperature (capped between 0 and 1)
    const resolvedTemp = (typeof temperature === 'number' && temperature >= 0 && temperature <= 1)
        ? temperature
        : 0.2;

    try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: resolvedModel,
                max_tokens: resolvedMaxTokens,
                temperature: resolvedTemp,
                ...(system ? { system } : {}),
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!anthropicRes.ok) {
            const errBody = await anthropicRes.text();
            return res.status(anthropicRes.status).json({
                error: `Anthropic API error: ${anthropicRes.status}`,
                details: errBody
            });
        }

        const data = await anthropicRes.json();

        // Forward only the text content to the client
        const textContent = data.content?.find(c => c.type === 'text');
        return res.status(200).json({
            text: textContent?.text || '',
            content: data.content
        });
    } catch (err) {
        return res.status(502).json({ error: 'Failed to reach Anthropic API', details: err.message });
    }
}
