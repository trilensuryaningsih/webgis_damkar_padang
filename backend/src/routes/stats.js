const express = require('express');
const router = express.Router();

// GET /api/stats (Placeholder)
router.get('/', (req, res) => {
  res.json({ message: 'Placeholder Route Stats' });
});

module.exports = router;
