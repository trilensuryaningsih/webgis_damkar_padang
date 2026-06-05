const express = require('express');
const router = express.Router();

// GET /api/jalan (Placeholder)
router.get('/', (req, res) => {
  res.json({ message: 'Placeholder Route Jalan' });
});

module.exports = router;
