// Pour Vercel : créer ce fichier dans api/compliance-analysis.js

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, productName, therapeuticArea, markets, code } = req.body;

        // Access control: same rules as /api/verify-access, enforced again here
        // so that disabling access (ACCESS_ENABLED=false) blocks generation
        // immediately, even for a browser tab that unlocked earlier.
        const expectedCode = process.env.ACCESS_CODE;
        if (expectedCode) {
            if (process.env.ACCESS_ENABLED === 'false') {
                return res.status(403).json({ error: 'access_disabled' });
            }
            if (code !== expectedCode) {
                return res.status(403).json({ error: 'invalid_code' });
            }
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

        // Call Claude API
        const message = await client.messages.create({
            model: 'claude-sonnet-5',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const analysis = message.content[0].type === 'text'
            ? message.content[0].text
            : 'Unable to generate analysis';

        return res.status(200).json({
            analysis: analysis,
            productName: productName,
            therapeuticArea: therapeuticArea,
            markets: markets,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}
