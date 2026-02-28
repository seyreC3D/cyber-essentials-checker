const { onRequest } = require('firebase-functions/v2/https');
const analyzeHandler = require('./analyze');

// API proxy for Claude — rewrites from /api/analyze hit this function
exports.analyze = onRequest(
    { cors: true, secrets: ['ANTHROPIC_API_KEY'] },
    analyzeHandler
);

// Health-check endpoint — rewrites from /api/hello hit this function
exports.hello = onRequest({ cors: true }, (req, res) => {
    res.status(200).json({ ok: true });
});
