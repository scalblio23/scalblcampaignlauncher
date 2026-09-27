import { neon } from '@neondatabase/serverless';

// Vercel's Neon integration exposes the connection string as DATABASE_URL (POSTGRES_URL on older setups).
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = url ? neon(url) : null;
let ready = null;

function init() {
  if (!ready) {
    ready = sql`CREATE TABLE IF NOT EXISTS launch_runs (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.catch(e => { ready = null; throw e; });
  }
  return ready;
}

const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sql) return res.status(503).json({ error: 'DATABASE_URL is not set' });

  // Optional shared password: set APP_KEY in Vercel to require it.
  if (process.env.APP_KEY && req.headers['x-app-key'] !== process.env.APP_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await init();
    const id = req.query.id;

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, data FROM launch_runs ORDER BY updated_at`;
      return res.status(200).json({ runs: Object.fromEntries(rows.map(r => [r.id, r.data])) });
    }

    if (!validId(id)) return res.status(400).json({ error: 'Invalid id' });

    if (req.method === 'PUT') {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!data || typeof data !== 'object' || !data.values) return res.status(400).json({ error: 'Invalid run' });
      await sql`INSERT INTO launch_runs (id, data, updated_at) VALUES (${id}, ${JSON.stringify(data)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM launch_runs WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
}
