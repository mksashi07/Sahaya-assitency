const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── SUPABASE ADMIN CLIENT ────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// ─── IN-MEMORY TRIP STORE ─────────────────────────────────────────────────────
let trips = [];
let nextId = 1;

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Invalid token');
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Request a trip (Passenger)
app.post('/trips', verifyToken, (req, res) => {
  const { pickup, drop } = req.body;
  if (!pickup || !drop) {
    return res.status(400).json({ error: 'Pickup and drop are required' });
  }
  const trip = {
    id: nextId++,
    pickup,
    drop,
    status: 'REQUESTED',
    userId: req.user.id,
  };
  trips.push(trip);
  res.status(201).json(trip);
});

// Get all trips
app.get('/trips', verifyToken, (req, res) => {
  res.json(trips);
});

// Accept a trip (Hamali)
app.post('/trips/:id/accept', verifyToken, (req, res) => {
  const trip = trips.find((t) => t.id === parseInt(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'REQUESTED') return res.status(400).json({ error: 'Trip already accepted' });
  trip.status = 'ACCEPTED';
  res.json(trip);
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
