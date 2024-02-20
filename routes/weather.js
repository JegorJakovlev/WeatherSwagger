const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', authMiddleware, (req, res) => {
  res.send('Get weather data');
});

router.post('/', authMiddleware, (req, res) => {
  res.send('Add weather data');
});

router.put('/:id', authMiddleware, (req, res) => {
  res.send('Update weather data');
});

router.delete('/:id', authMiddleware, (req, res) => {
  res.send('Delete weather data');
});

module.exports = router;
