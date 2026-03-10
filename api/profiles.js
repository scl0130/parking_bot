const { kv } = require('@vercel/kv');

const KEY = 'parking_profiles';

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const profiles = (await kv.get(KEY)) || [];
      return res.json(profiles);
    }

    if (req.method === 'POST') {
      const profile = req.body;
      const profiles = (await kv.get(KEY)) || [];
      const idx = profiles.findIndex(p => p.id === profile.id);
      if (idx >= 0) profiles[idx] = profile;
      else profiles.push(profile);
      await kv.set(KEY, profiles);
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const profiles = (await kv.get(KEY)) || [];
      await kv.set(KEY, profiles.filter(p => p.id !== id));
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
