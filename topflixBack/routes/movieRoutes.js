const express = require('express');
const movieController = require('../controllers/movieController');

const router = express.Router();

router.get('/:movie', movieController.getVideo);

module.exports = router;