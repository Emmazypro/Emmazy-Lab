require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for Vercel (since file system is read-only)
let projectsData = [];
let testimoniesData = [];
let galleryData = [];

// Load initial data
try {
  if (fs.existsSync(path.join(__dirname, 'projects.json'))) {
    projectsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'projects.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(__dirname, 'testimonies.json'))) {
    testimoniesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'testimonies.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(__dirname, 'gallery.json'))) {
    galleryData = JSON.parse(fs.readFileSync(path.join(__dirname, 'gallery.json'), 'utf8'));
  }
} catch (error) {
  console.log('Initial data load failed, using empty arrays');
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: true
}));

// Paths to JSON files
const projectsFile = path.join(__dirname, 'projects.json');
const testimoniesFile = path.join(__dirname, 'testimonies.json');

// Helper to read JSON
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
}

// Helper to write JSON
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    throw new Error('Failed to save data');
  }
}

// Routes for Projects
app.get('/api/projects', (req, res) => {
  res.json(projectsData);
});

app.post('/api/projects', (req, res) => {
  const { title, link, image, client, description } = req.body;
  if (!title || !link || !image || !client || !description) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  projectsData.push({
    title: title.trim(),
    link: link.trim(),
    image: image.trim(),
    client: client.trim(),
    description: description.trim()
  });
  res.json({ success: true, message: 'Project saved' });
});

// Routes for Testimonies
app.get('/api/testimonies', (req, res) => {
  res.json(testimoniesData);
});

app.post('/api/testimonies', (req, res) => {
  const { name, country, review } = req.body;
  if (!name || !country || !review) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  testimoniesData.push({
    name: name.trim(),
    country: country.trim(),
    review: review.trim()
  });
  res.json({ success: true, message: 'Testimony saved' });
});

// Routes for Gallery
app.get('/api/gallery', (req, res) => {
  res.json(galleryData);
});

app.post('/api/gallery', (req, res) => {
  const { image, title } = req.body;
  if (!image || !title) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  galleryData.push({
    image: image.trim(),
    title: title.trim()
  });
  res.json({ success: true, message: 'Gallery item saved' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});