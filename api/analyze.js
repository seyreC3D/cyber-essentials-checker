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

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "prompt" in request body.' });
    }

    // Limit prompt length to prevent abuse
    if (prompt.length > 50000) {
        return res.status(400).json({ error: 'Prompt too long.' });
    }

    try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
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
