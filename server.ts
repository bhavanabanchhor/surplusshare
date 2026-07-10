import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';

// In-memory mock database for the prototype
interface Listing {
  id: string;
  title: string;
  description: string;
  quantity: string;
  location: string;
  donorName: string;
  expiryTime: string;
  status: 'available' | 'claimed';
  createdAt: string;
}

// Initial seed data
const listings: Listing[] = [
  {
    id: randomUUID(),
    title: 'Catered Sandwiches & Wraps',
    description: 'Leftover from a corporate lunch event. Mostly turkey and vegetarian options. Kept refrigerated.',
    quantity: 'Approx 20 portions',
    location: 'Tech Park, Building C',
    donorName: 'Corporate Events Inc',
    expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours from now
    status: 'available',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: randomUUID(),
    title: 'Assorted Bakery Items',
    description: 'End of day surplus. Breads, muffins, and a few croissants.',
    quantity: '2 large boxes',
    location: 'Downtown Bakery, 4th Ave',
    donorName: 'Sunny Side Bakery',
    expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
    status: 'available',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: randomUUID(),
    title: 'Fresh Produce Box',
    description: 'Slightly bruised apples and bananas, still perfectly good for consumption or smoothies.',
    quantity: '15 lbs',
    location: 'City Market',
    donorName: 'Green Grocers',
    expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'claimed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get('/api/listings', (req, res) => {
    res.json(listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post('/api/listings', (req, res) => {
    const { title, description, quantity, location, donorName, expiryTime } = req.body;
    
    if (!title || !quantity || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newListing: Listing = {
      id: randomUUID(),
      title,
      description: description || '',
      quantity,
      location,
      donorName: donorName || 'Anonymous Donor',
      expiryTime: expiryTime || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      status: 'available',
      createdAt: new Date().toISOString()
    };

    listings.unshift(newListing); // Add to beginning
    res.status(201).json(newListing);
  });

  app.post('/api/listings/:id/claim', (req, res) => {
    const { id } = req.params;
    const listing = listings.find(l => l.id === id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status === 'claimed') {
      return res.status(400).json({ error: 'Listing already claimed' });
    }

    listing.status = 'claimed';
    res.json(listing);
  });

  app.get('/api/stats', (req, res) => {
    const totalListings = listings.length;
    const totalClaimed = listings.filter(l => l.status === 'claimed').length;
    const activeAvailable = totalListings - totalClaimed;
    // Mock environmental impact stats
    const estimatedMealsProvided = totalClaimed * 5; // approx 5 meals per claim
    const co2SavedKg = totalClaimed * 12.5; // approx 12.5kg CO2 saved per claim

    res.json({
      totalListings,
      activeAvailable,
      totalClaimed,
      estimatedMealsProvided,
      co2SavedKg
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
