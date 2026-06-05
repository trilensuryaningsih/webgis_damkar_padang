const express = require('express');
const router = express.Router();

// GET /api/damkar (Placeholder)
router.get('/', (req, res) => {
  res.json({ message: 'Placeholder Route Damkar (Peta)' });
});

// GET /api/damkar/list (Placeholder)
router.get('/list', (req, res) => {
  res.json([]);
});

module.exports = router;
