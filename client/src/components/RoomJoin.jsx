// File: src/components/RoomJoin.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RoomJoin = () => {
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateRoomCode = (code) => {
    // Alphanumeric only, any length (minimum 1 character)
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(code) && code.length > 0;
  };

  const formatRoomCode = (value) => {
    // Remove non-alphanumeric characters and convert to uppercase
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleInputChange = (e) => {
    const formatted = formatRoomCode(e.target.value);
    setRoomCode(formatted);
    
    // Clear error when user starts typing
    if (errorMsg) setErrorMsg('');
  };

  const handleJoin = async () => {
    const trimmedCode = roomCode.trim();
    
    if (!trimmedCode) {
      setErrorMsg('Please enter a room code.');
      inputRef.current?.focus();
      return;
    }
    
    if (!validateRoomCode(trimmedCode)) {
      setErrorMsg('Room code can only contain letters and numbers.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/rooms/join`, {
        roomId: trimmedCode,
      });
      navigate(`/room/${trimmedCode}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to join the room. Please try again.';
      setErrorMsg(message);
      console.error(err);
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  const generateSampleCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join  Room
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a room code to start drawing together
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tutorial Section */}
          {showTutorial && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How to Join
                  </h3>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Get a room code from someone already in a room</li>
                    <li>• Room codes can be any combination of letters and numbers</li>
                    <li>• Examples: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">GAME123</span>, <span className="font-mono bg-white/20 px-2 py-0.5 rounded">STUDY2024</span></li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close tutorial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="p-10">
            <div className="space-y-8">
              {/* Input Field */}
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Room Code
                </label>
                <div className="relative">
                  <input
                    id="roomCode"
                    ref={inputRef}
                    value={roomCode}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter room code"
                    className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all duration-300 text-lg font-medium tracking-wide shadow-inner"
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                {/* Validation indicator */}
                {roomCode && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {validateRoomCode(roomCode) ? (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                </div>
                {/* Status indicator */}
                <div className="mt-3 text-sm">
                  {roomCode.length > 0 && (
                    <div className="flex items-center">
                      {validateRoomCode(roomCode) ? (
                        <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Valid room code</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500 dark:text-red-400">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Letters and numbers only</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-400 text-sm">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={loading || !validateRoomCode(roomCode)}
                className="group relative w-full flex items-center justify-center px-6 py-4 font-semibold text-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-2xl shadow-xl hover:shadow-2xl disabled:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {loading && (
                  <svg className="animate-spin mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                
                <span className="relative z-10">
                  {loading ? 'Joining Room...' : 'Join Room'}
                </span>
              </button>
            </div>

            {/* Additional Actions */}
            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                  Don't have a room code?
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomJoin;