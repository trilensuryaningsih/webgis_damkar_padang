const express = require('express');
const router = express.Router();

// GET /api/blankspot (Placeholder)
router.get('/', (req, res) => {
  res.json({ message: 'Placeholder Route Blankspot' });
});

module.exports = router;
