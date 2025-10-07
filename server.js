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
  const projects = readJSON(projectsFile);
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { title, link, image, client, description } = req.body;
  if (!title || !link || !image || !client || !description) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const projects = readJSON(projectsFile);
  projects.push({ title, link, image, client, description });
  writeJSON(projectsFile, projects);
  res.json({ success: true, message: 'Project saved' });
});

// Routes for Testimonies
app.get('/api/testimonies', (req, res) => {
  const testimonies = readJSON(testimoniesFile);
  res.json(testimonies);
});

app.post('/api/testimonies', (req, res) => {
  const { name, country, review } = req.body;
  if (!name || !country || !review) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const testimonies = readJSON(testimoniesFile);
  testimonies.push({ name, country, review });
  writeJSON(testimoniesFile, testimonies);
  res.json({ success: true, message: 'Testimony saved' });
});

// Routes for Gallery
const galleryFile = path.join(__dirname, 'gallery.json');

app.get('/api/gallery', (req, res) => {
  const gallery = readJSON(galleryFile);
  res.json(gallery);
});

app.post('/api/gallery', (req, res) => {
  const { image, title } = req.body;
  if (!image || !title) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const gallery = readJSON(galleryFile);
  gallery.push({ image, title });
  writeJSON(galleryFile, gallery);
  res.json({ success: true, message: 'Gallery item saved' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});