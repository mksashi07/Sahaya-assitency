const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized Successfully");
} catch (error) {
  console.warn("⚠️ Warning: Could not initialize Firebase Admin. Ensure 'serviceAccountKey.json' is in the backend directory.");
}

const app = express();
app.use(cors());
app.use(express.json());

// In-memory Database
let trips = [];
let tripCounter = 1;

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// API: Verify Auth
app.post('/auth/verify', verifyToken, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
});

// API: Create Trip
app.post('/trips', verifyToken, (req, res) => {
  const { pickup, drop } = req.body;
  if (!pickup || !drop) {
    return res.status(400).json({ error: "Pickup and drop are required" });
  }

  const newTrip = {
    id: tripCounter++,
    pickup,
    drop,
    status: "REQUESTED",
    userId: req.user.uid
  };
  
  trips.push(newTrip);
  res.status(201).json(newTrip);
});

// API: Get All Trips
app.get('/trips', verifyToken, (req, res) => {
  res.json(trips);
});

// API: Accept Trip
app.post('/trips/:id/accept', verifyToken, (req, res) => {
  const tripId = parseInt(req.params.id);
  const trip = trips.find(t => t.id === tripId);

  if (!trip) {
    return res.status(404).json({ error: "Trip not found" });
  }
  
  if (trip.status === "ACCEPTED") {
    return res.status(400).json({ error: "Trip is already accepted" });
  }

  trip.status = "ACCEPTED";
  res.json(trip);
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
