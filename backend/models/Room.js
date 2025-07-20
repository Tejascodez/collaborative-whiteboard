// server/models/Room.js

const mongoose = require('mongoose');

const DrawingCommandSchema = new mongoose.Schema({
  type: {
    type: String, // 'stroke' or 'clear'
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // stroke path, color, width, etc.

  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  drawingData: [DrawingCommandSchema], // stores all strokes/clears
});

module.exports = mongoose.model('Room', RoomSchema);
