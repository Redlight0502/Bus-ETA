import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map();

async function kmb(endpoint, ttl = 30000) {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.time < ttl) return cached.data;
  const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/${endpoint}`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Bus data unavailable');
  const body = await response.json();
  cache.set(endpoint, { data: body.data, time: Date.now() });
  return body.data;
}


app.get('/api/health', (req, res) => {
  console.log(`request: ${req.method} ${req.url}`);
  res.json({
    status: 'ok'
  });
});
app.get('/api/stops', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const stops = await kmb('stop', 86400000);
    res.json({
      data: stops.filter(s => !q || `${s.name_tc} ${s.name_en} ${s.stop}`.toLowerCase().includes(q)).slice(0, 60)
    });
  } catch (error) { next(error); }
});


app.get('/api/arrivals', async (req, res, next) => {
  const stop = String(req.query.stop || '6E6EBC9D1AF2DA52');
  if (!/^[A-F0-9]{16}$/.test(stop)) return res.status(400).json({ error: 'Invalid stop ID' });
  try { res.json({ data: await kmb(`stop-eta/${stop}`), updatedAt: new Date().toISOString() }); }
  catch (error) { next(error); }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((error, req, res, next) => {
  res.status(502).json({ error: 'Unable to reach the bus data provider. Please try again.' });
});
app.use(express.static(path.join(root, 'dist')));

const port = process.env.PORT || 3000;

app.listen(port, '127.0.0.1', () => console.log(`Bus Daily: http://localhost:${port}`));
