const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes (akan diisi bertahap, saat ini menggunakan placeholder)
app.use('/api/damkar', require('./routes/damkar'));
app.use('/api/coverage', require('./routes/coverage'));
app.use('/api/blankspot', require('./routes/blankspot'));
app.use('/api/rekomendasi', require('./routes/rekomendasi'));
app.use('/api/jalan', require('./routes/jalan'));
app.use('/api/stats', require('./routes/stats'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ WebGIS Damkar Padang API berjalan!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
