// server/socket/index.js
const Room = require('../models/Room');

// Store room users with their info
const roomUsers = new Map();

module.exports = function registerSocketHandlers(io, socket) {
  console.log(`🟢 Socket connected: ${socket.id}`);

  let currentRoomId = null;
  let userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
  let userInfo = {
    id: socket.id,
    username: `User_${socket.id.slice(0, 6)}`,
    color: userColor,
    joinedAt: new Date()
  };

  // Helper function to add user to room tracking
  const addUserToRoom = (roomId, userData) => {
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    roomUsers.get(roomId).set(socket.id, userData);
  };

  // Helper function to remove user from room tracking
  const removeUserFromRoom = (roomId) => {
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId).delete(socket.id);
      if (roomUsers.get(roomId).size === 0) {
        roomUsers.delete(roomId);
      }
    }
  };

  // 1. Join a room with validation and user tracking
  socket.on('join-room', async (roomId, userData = {}) => {
    try {
      // Handle leaving previous room
      if (currentRoomId) {
        socket.leave(currentRoomId);
        removeUserFromRoom(currentRoomId);
        
        const oldRoom = io.sockets.adapter.rooms.get(currentRoomId);
        const oldCount = oldRoom ? oldRoom.size : 0;
        io.to(currentRoomId).emit('room-users-count', oldCount);
        
        // Notify users in old room that this user left
        socket.to(currentRoomId).emit('user-left', {
          userId: userInfo.id,
          username: userInfo.username
        });
      }

      // Validate roomId
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }

      socket.join(roomId);
      currentRoomId = roomId;

      // Update user info with any provided data
      userInfo = {
        id: socket.id,
        username: userData.username || userInfo.username,
        color: userColor,
        roomId: roomId,
        joinedAt: new Date()
      };

      // Add user to room tracking
      addUserToRoom(roomId, userInfo);
      
      // Initialize room in DB if it doesn't exist
      await Room.findOneAndUpdate(
        { roomId },
        { $setOnInsert: { roomId } },
        { upsert: true }
      );

      const room = io.sockets.adapter.rooms.get(roomId);
      const count = room ? room.size : 0;
      
      io.to(roomId).emit('room-users-count', count);
      socket.to(roomId).emit('user-connected', socket.id, userColor);

      // Notify other users that this user joined
      socket.to(roomId).emit('user-joined', {
        userId: userInfo.id,
        username: userInfo.username
      });

      // Load existing drawing data with validation
      const roomData = await Room.findOne({ roomId });
      if (roomData?.drawingData?.length > 0) {
        const validDrawingData = roomData.drawingData.filter(d => d.data);
        socket.emit('load-drawing-data', validDrawingData);
      }

      console.log(`👤 User ${userInfo.username} joined room ${roomId} (${count} users)`);
    } catch (err) {
      console.error("❌ Room join error:", err);
      socket.emit('room-error', err.message);
    }
  });

  // 2. Cursor movement with validation
  socket.on('cursor-move', (cursorData) => {
    if (!currentRoomId || !cursorData) return;
    
    const validData = {
      x: Number(cursorData.x) || 0,
      y: Number(cursorData.y) || 0,
      color: cursorData.color || userColor
    };
    
    socket.to(currentRoomId).emit('cursor-update', {
      socketId: socket.id,
      ...validData
    });
  });

  // 3. Drawing events with validation
  socket.on('draw-start', (data) => {
    if (currentRoomId && data) {
      socket.to(currentRoomId).emit('draw-start', { 
        socketId: socket.id,
        ...data 
      });
    }
  });

  socket.on('draw-move', (data) => {
    if (currentRoomId && data) {
      socket.to(currentRoomId).emit('draw-move', { 
        socketId: socket.id,
        ...data 
      });
    }
  });

  socket.on('draw-end', async (data) => {
    if (!currentRoomId || !data) return;

    try {
      const validData = {
        ...data,
        points: Array.isArray(data.points) ? data.points : [],
        color: data.color || userColor,
        strokeWidth: Number(data.strokeWidth) || 2
      };

      socket.to(currentRoomId).emit('draw-end', { 
        socketId: socket.id,
        ...validData 
      });

      await Room.findOneAndUpdate(
        { roomId: currentRoomId },
        {
          $push: {
            drawingData: {
              type: 'stroke',
              data: validData,
              timestamp: new Date(),
              socketId: socket.id
            }
          },
          $set: { lastActivity: new Date() }
        }
      );
    } catch (err) {
      console.error("❌ Error saving stroke:", err);
    }
  });

  // 4. Clear canvas with validation
  socket.on('clear-canvas', async () => {
    if (!currentRoomId) return;

    try {
      io.to(currentRoomId).emit('clear-canvas');

      await Room.findOneAndUpdate(
        { roomId: currentRoomId },
        {
          $push: {
            drawingData: {
              type: 'clear',
              data: { clearedBy: socket.id },
              timestamp: new Date(),
              socketId: socket.id
            }
          },
          $set: { lastActivity: new Date() }
        }
      );
    } catch (err) {
      console.error("❌ Error saving clear:", err);
    }
  });

  // 5. Handle manual leave room
  socket.on('leave-room', (roomId) => {
    if (roomId && roomId === currentRoomId) {
      handleUserLeave('manual');
    }
  });

  // Helper function to handle user leaving/disconnecting
  const handleUserLeave = (reason = 'disconnect') => {
    if (!currentRoomId) return;

    // Remove from room tracking
    removeUserFromRoom(currentRoomId);

    const room = io.sockets.adapter.rooms.get(currentRoomId);
    const count = room ? room.size - 1 : 0;

    // Emit appropriate event based on reason
    let eventType, eventData;
    
    switch (reason) {
      case 'manual':
        eventType = 'user-left';
        eventData = {
          userId: userInfo.id,
          username: userInfo.username
        };
        break;
      case 'ping timeout':
        eventType = 'user-disconnected';
        eventData = {
          userId: userInfo.id,
          username: userInfo.username,
          reason: 'timeout'
        };
        break;
      default:
        eventType = 'user-disconnected';
        eventData = {
          userId: userInfo.id,
          username: userInfo.username,
          reason: 'disconnect'
        };
    }

    // Notify other users in the room
    socket.to(currentRoomId).emit(eventType, eventData);
    socket.to(currentRoomId).emit('user-disconnected', socket.id);
    io.to(currentRoomId).emit('room-users-count', count);
  };

  // 6. Handle disconnect with reason tracking
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Socket disconnected: ${socket.id}, Reason: ${reason}`);
    
    if (currentRoomId) {
      handleUserLeave(reason);
    }
  });

  // 7. Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('🔴 Connection error:', error);
  });

  // 8. Optional: Get room users (for debugging or additional features)
  socket.on('get-room-users', () => {
    if (currentRoomId && roomUsers.has(currentRoomId)) {
      const users = Array.from(roomUsers.get(currentRoomId).values());
      socket.emit('room-users-list', users);
    }
  });

  // 9. Optional: Update username
  socket.on('update-username', (newUsername) => {
    if (newUsername && typeof newUsername === 'string' && currentRoomId) {
      const oldUsername = userInfo.username;
      userInfo.username = newUsername;
      
      // Update in room tracking
      if (roomUsers.has(currentRoomId)) {
        roomUsers.get(currentRoomId).set(socket.id, userInfo);
      }

      // Notify other users of username change
      socket.to(currentRoomId).emit('username-changed', {
        userId: userInfo.id,
        oldUsername,
        newUsername
      });
      console.log(`👤 User ${socket.id} changed username from ${oldUsername} to ${newUsername}`);
    }
  });
};

// Export helper functions for external use if needed
module.exports.getRoomUsers = (roomId) => {
  return roomUsers.has(roomId) ? Array.from(roomUsers.get(roomId).values()) : [];
};

module.exports.getRoomUserCount = (roomId) => {
  return roomUsers.has(roomId) ? roomUsers.get(roomId).size : 0;
};

module.exports.getAllRooms = () => {
  const result = {};
  for (const [roomId, users] of roomUsers.entries()) {
    result[roomId] = Array.from(users.values());
  }
  return result;
};