import React, { useRef, useEffect, useState } from 'react';
import socket from '../sockets/socket';

const DrawingCanvas = ({ roomId = 'demo-room', color = '#3b82f6', strokeWidth = 3 }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef(null);
  const [isConnected, setIsConnected] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Function to add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Function to remove notification manually
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    ctxRef.current = ctx;
    setCanvasReady(true);

    socket.emit('join-room', roomId);

    // Existing drawing event listeners
    socket.on('draw-start', ({ x, y, color, strokeWidth }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    });

    socket.on('draw-move', ({ x, y }) => {
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on('clear-canvas', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // New user connection/disconnection event listeners
    socket.on('user-joined', ({ userId, username }) => {
      addNotification(`${username || userId} joined the room`, 'success');
    });

    socket.on('user-left', ({ userId, username }) => {
      addNotification(`${username || userId} left the room`, 'warning');
    });

    socket.on('user-disconnected', ({ userId, username, reason }) => {
      const message = reason === 'timeout' 
        ? `${username || userId} went offline (timeout)`
        : `${username || userId} disconnected`;
      addNotification(message, 'error');
    });

    // Connection status listeners
    socket.on('connect', () => {
      setIsConnected(true);
      addNotification('Connected to room', 'success');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addNotification('Disconnected from room', 'error');
    });

    const handleResize = () => {
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      canvas.style.width = newRect.width + 'px';
      canvas.style.height = newRect.height + 'px';
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    window.addEventListener('resize', handleResize);

    return () => {
      socket.off('draw-start');
      socket.off('draw-move');
      socket.off('clear-canvas');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-disconnected');
      socket.off('connect');
      socket.off('disconnect');
      window.removeEventListener('resize', handleResize);
    };
  }, [roomId]);

  const handleMouseDown = (e) => {
    if (!canvasReady) return;
    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = strokeWidth;
    socket.emit('draw-start', { x, y, color, strokeWidth });
    lastPoint.current = { x, y };
  };

  const handleMouseMove = (e) => {
    if (!drawing.current || !canvasReady) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    socket.emit('draw-move', { x, y });
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  // Get notification styles based on type
  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Connection Status */}
      <div className={`absolute top-5 right-5 flex items-center gap-2 px-3 py-1 rounded-full shadow-lg border backdrop-blur-md text-sm font-medium ${isConnected ? 'text-green-600 border-green-200 bg-white/80' : 'text-red-600 border-red-200 bg-white/80'}`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-blue-900' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Room Info */}
      <div className="absolute top-5 left-5 px-3 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md bg-white/80 text-gray-700 text-sm font-medium">
        Room: {roomId}
      </div>

      {/* Notifications */}
      <div className="absolute top-16 left-5 space-y-2 z-30 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-left-5 duration-300 ${getNotificationStyles(notification.type)}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Canvas Background Grid */}
      <div className="absolute inset-0 bg-white bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[20px_20px] z-0" />

      {/* Loading Overlay */}
      {!canvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-20 text-gray-700 font-medium">
          <div className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-4"></div>
          Preparing canvas...
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 w-full h-full z-10 touch-none bg-transparent cursor-crosshair"
      />
    </div>
  );
};

export default DrawingCanvas;