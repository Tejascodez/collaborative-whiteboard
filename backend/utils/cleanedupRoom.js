// server/utils/cleanupRooms.js

const Room = require('../models/Room');

const cleanupInactiveRooms = async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const result = await Room.deleteMany({ lastActivity: { $lt: cutoff } });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} inactive rooms`);
    }
  } catch (err) {
    console.error("❌ Error cleaning rooms:", err);
  }
};

module.exports = cleanupInactiveRooms;
