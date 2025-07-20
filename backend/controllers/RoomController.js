// server/controllers/roomController.js

const Room = require('../models/Room');

// POST /api/rooms/join
const joinRoom = async (req, res) => {
  const { roomId } = req.body;

  if (!roomId || roomId.length < 6) {
    return res.status(400).json({ message: "Invalid or missing room ID." });
  }

  try {
    let room = await Room.findOne({ roomId });

    if (!room) {
      // Create new room
      room = new Room({ roomId });
      await room.save();
      console.log(`✅ Room created: ${roomId}`);
    } else {
      // Update lastActivity
      room.lastActivity = new Date();
      await room.save();
      console.log(`👥 Joined existing room: ${roomId}`);
    }

    res.status(200).json({ success: true, roomId });
  } catch (err) {
    console.error("❌ Room join error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/rooms/:roomId
const getRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (err) {
    console.error("❌ Fetch room error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  joinRoom,
  getRoom,
};
