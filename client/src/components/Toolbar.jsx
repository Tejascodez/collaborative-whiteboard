import React, { useState } from 'react';

const Toolbar = ({ 
  color = '#3b82f6', 
  setColor = () => {}, 
  strokeWidth = 3, 
  setStrokeWidth = () => {}, 
  clearCanvas = () => {} 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const predefinedColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Indigo', value: '#6366f1' }
  ];

  const brushSizes = [
    { size: 1, label: 'Fine' },
    { size: 3, label: 'Normal' },
    { size: 6, label: 'Medium' },
    { size: 10, label: 'Large' },
    { size: 15, label: 'Extra Large' }
  ];

  const handleColorSelect = (colorValue) => {
    setColor(colorValue);
    setShowColorPicker(false);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      clearCanvas();
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-16 left-5 w-12 h-12 bg-white/95 backdrop-blur-md border border-white/20 rounded-full shadow-lg z-50 flex items-center justify-center hover:scale-105 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle toolbar"
      >
        <div className="flex flex-col gap-1">
          <span className="w-4 h-0.5 bg-gray-700 rounded transition-all duration-300"></span>
          <span className="w-4 h-0.5 bg-gray-700 rounded transition-all duration-300"></span>
          <span className="w-4 h-0.5 bg-gray-700 rounded transition-all duration-300"></span>
        </div>
      </button>

      {/* Main Toolbar */}
      <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-5 flex gap-8 items-start z-40 max-w-[90vw] transition-all duration-300 ${isExpanded ? 'md:flex' : 'hidden md:flex'} ${isExpanded ? 'flex-col md:flex-row' : ''}`}>
        
        {/* Color Section */}
        <div className="flex flex-col gap-3 relative">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Color</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full border-4 border-white shadow-md cursor-pointer hover:scale-110 transition-all duration-200"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <span className="text-xs text-gray-500">Current</span>
          </div>
          
          {showColorPicker && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 z-50 border border-gray-100 min-w-52">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {predefinedColors.map((colorOption, index) => (
                  <button
                    key={index}
                    className={`w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-all duration-200 relative flex items-center justify-center ${color === colorOption.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => handleColorSelect(colorOption.value)}
                    title={colorOption.name}
                  >
                    {color === colorOption.value && (
                      <span className="text-white text-xs font-bold drop-shadow">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center gap-2">
                <label className="text-xs text-gray-600">Custom:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-6 rounded border-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brush Size Section */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Brush Size</span>
            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded-full">{strokeWidth}px</span>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            {/* Brush Preview */}
            <div className="flex justify-center items-center h-8">
              <div 
                className="rounded-full transition-all duration-200"
                style={{ 
                  width: `${Math.min(strokeWidth * 2, 24)}px`, 
                  height: `${Math.min(strokeWidth * 2, 24)}px`,
                  backgroundColor: color
                }}
              />
            </div>
            
            {/* Slider */}
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            
            {/* Quick Size Buttons */}
            <div className="flex gap-1">
              {brushSizes.map((brush, index) => (
                <button
                  key={index}
                  className={`w-6 h-6 rounded-full border transition-all duration-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 ${strokeWidth === brush.size ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white'}`}
                  onClick={() => setStrokeWidth(brush.size)}
                  title={`${brush.label} (${brush.size}px)`}
                >
                  <div 
                    className="bg-gray-600 rounded-full"
                    style={{
                      width: `${Math.min(brush.size * 1.5, 16)}px`,
                      height: `${Math.min(brush.size * 1.5, 16)}px`
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</span>
          <div className="flex gap-2">
            <button 
              className="flex flex-col items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-red-500 hover:bg-red-50 transition-all duration-200 hover:-translate-y-0.5"
              onClick={handleClear}
            >
              <span className="text-base">🗑️</span>
              <span className="text-xs font-medium text-gray-700">Clear</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-white opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="text-base">↶</span>
              <span className="text-xs font-medium text-gray-700">Undo</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};

export default Toolbar;