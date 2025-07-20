// server/routes/roomRoutes.js

const express = require('express');
const router = express.Router();
const { joinRoom, getRoom } = require('../controllers/RoomController');

router.post('/join', joinRoom);
router.get('/:roomId', getRoom);

module.exports = router;
