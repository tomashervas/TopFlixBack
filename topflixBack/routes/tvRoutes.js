const express = require('express');
const tvController = require('../controllers/tvController');

const router = express.Router();

router.get('/:serie/:temporada/:capitulo', tvController.getTv);

module.exports = router;