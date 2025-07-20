import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursor';
import socket from '../sockets/socket';

const Whiteboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [cursors, setCursors] = useState({});
  const [activeUsers, setActiveUsers] = useState(1);
  const [userColors, setUserColors] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(true);

  const clearCanvas = () => {
    socket.emit('clear-canvas');
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const leaveRoom = () => {
    socket.emit('leave-room', roomId);
    navigate('/');
  };

  useEffect(() => {
    // Generate a random color for the current user
    const myColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    setColor(myColor);
    
    // Join the room with the user's color
    socket.emit('join-room', roomId, myColor);
    setIsConnected(true);

    // Listen for room user count updates
    socket.on('room-users-count', (count) => {
      setActiveUsers(count);
    });

    // Handle cursor updates from other users
    socket.on('cursor-update', ({ socketId, x, y, color }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, color },
      }));
    });

    // Handle new user connections
    socket.on('user-connected', (socketId, color) => {
      setUserColors((prev) => ({ ...prev, [socketId]: color }));
    });

    // Handle user disconnections
    socket.on('user-disconnected', (socketId) => {
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[socketId];
        return newCursors;
      });
      setUserColors((prev) => {
        const newColors = { ...prev };
        delete newColors[socketId];
        return newColors;
      });
    });

    // Clean up listeners
    return () => {
      socket.off('room-users-count');
      socket.off('cursor-update');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.emit('leave-room', roomId);
    };
  }, [roomId]);

  // Track mouse movement for cursor sharing
  const handleMouseMove = (e) => {
    if (!e.target) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Emit cursor position to others
    socket.emit('cursor-move', { 
      x, 
      y, 
      color: userColors[socket.id] || color 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Room Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Room: 
                </span>
                <button
                  onClick={copyRoomCode}
                  className="font-mono text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 border border-gray-300 dark:border-gray-600"
                  title="Click to copy room code"
                >
                  {roomId}
                  <svg className="inline w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Center: Active Users */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-1">
                  {/* User avatars */}
                  <div className="flex -space-x-1">
                    {Array.from({ length: Math.min(activeUsers, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: `hsl(${(i * 137.5) % 360}, 70%, 60%)`,
                          zIndex: 10 - i
                        }}
                      >
                        {i + 1}
                      </div>
                    ))}
                    {activeUsers > 3 && (
                      <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-semibold">
                        +{activeUsers - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {activeUsers} {activeUsers === 1 ? 'person' : 'people'} online
                </div>
              </div>

              {/* Your Color Indicator */}
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">You:</span>
                <div
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ring-2 ring-gray-300 dark:ring-gray-600"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRoomInfo(!showRoomInfo)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Toggle room info"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={leaveRoom}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Room Info Panel (Collapsible) */}
      {showRoomInfo && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-sm font-medium">Share this room code with others to collaborate:</span>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-mono font-semibold transition-colors duration-200"
                >
                  {roomId}
                </button>
              </div>
              <button
                onClick={() => setShowRoomInfo(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden" onMouseMove={handleMouseMove}>
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-20">
          <Toolbar
            color={color}
            setColor={setColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            clearCanvas={clearCanvas}
          />
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-20">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg border ${
            isConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' 
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="h-full bg-white dark:bg-gray-800 shadow-inner">
          <DrawingCanvas 
            roomId={roomId} 
            color={color} 
            strokeWidth={strokeWidth} 
            socket={socket}
          />
        </div>
        
        {/* User Cursors Overlay */}
        <UserCursors 
          cursors={cursors} 
          userColors={userColors} 
        />

        {/* Quick Actions Floating Menu */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-2">
            <button
              onClick={clearCanvas}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Canvas</span>
            </button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            <button
              onClick={copyRoomCode}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Room Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;