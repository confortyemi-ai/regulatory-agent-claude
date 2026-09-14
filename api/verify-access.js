// Vérifie le code d'accès et l'interrupteur global avant d'autoriser l'utilisation de l'outil.
// Variables d'environnement Vercel :
//   ACCESS_CODE    - le code à communiquer à la personne autorisée (obligatoire pour activer la protection)
//   ACCESS_ENABLED - interrupteur global ("false" pour tout bloquer). Par défaut activé dès que ACCESS_CODE est défini.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, reason: 'method_not_allowed' });
    }

    const expectedCode = process.env.ACCESS_CODE;

    if (!expectedCode) {
        return res.status(200).json({ ok: false, reason: 'not_configured' });
    }

    if (process.env.ACCESS_ENABLED === 'false') {
        return res.status(200).json({ ok: false, reason: 'disabled' });
    }

    const { code } = req.body || {};

    if (code === expectedCode) {
        return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: false, reason: 'wrong_code' });
}
