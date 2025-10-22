'use client';

import { useState } from 'react';
import {
  MousePointer,
  MapPin,
  ArrowUpRight,
  Circle,
  Square,
  PenTool,
  Type,
  Palette,
  Minus
} from 'lucide-react';
import { AnnotationTool } from '@/app/(dashboard)/mockups/[id]/page';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  strokeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

const PRESET_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#A29BFE', // Purple
  '#FD79A8', // Pink
  '#74B9FF', // Blue
  '#55EFC4', // Green
  '#FDA7DF', // Rose
  '#636E72'  // Gray
];

export default function AnnotationToolbar({
  activeTool,
  onToolChange,
  strokeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange
}: AnnotationToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const tools: Array<{
    id: AnnotationTool;
    icon: React.ElementType;
    label: string;
  }> = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'pin', icon: MapPin, label: 'Pin' },
    { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'freehand', icon: PenTool, label: 'Freehand' },
    { id: 'text', icon: Type, label: 'Text' }
  ];

  return (
    <div className="h-full flex flex-col items-center py-4 gap-2">
      {/* Drawing Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`
                p-3 rounded-lg transition-all relative group
                ${isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              title={tool.label}
            >
              <Icon className="h-5 w-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tool.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-12 h-px bg-gray-200 my-2" />

      {/* Color Picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors relative group"
          title="Color"
        >
          <div className="relative">
            <Palette className="h-5 w-5 text-gray-600" />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: strokeColor }}
            />
          </div>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Color
          </div>
        </button>

        {/* Color Picker Dropdown */}
        {showColorPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowColorPicker(false)}
            />
            <div className="absolute left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setShowColorPicker(false);
                    }}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${strokeColor === color
                        ? 'border-blue-500 scale-110'
                        : 'border-gray-300 hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="text-xs text-gray-600 mb-1 block">
                  Custom Color
                </label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stroke Width */}
      <div className="relative">
        <button
          onClick={() => setShowStrokePicker(!showStrokePicker)}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors relative group"
          title="Stroke Width"
        >
          <div className="relative">
            <Minus className="h-5 w-5 text-gray-600" />
            <div className="absolute -bottom-1 -right-1 text-xs font-bold text-gray-900 bg-white rounded-full w-4 h-4 flex items-center justify-center border border-gray-300">
              {strokeWidth}
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Stroke Width
          </div>
        </button>

        {/* Stroke Width Picker */}
        {showStrokePicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowStrokePicker(false)}
            />
            <div className="absolute left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-48">
              <label className="text-xs text-gray-600 mb-2 block">
                Stroke Width: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
                className="w-full"
              />

              {/* Preset Widths */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[1, 3, 5, 8].map((width) => (
                  <button
                    key={width}
                    onClick={() => {
                      onStrokeWidthChange(width);
                      setShowStrokePicker(false);
                    }}
                    className={`
                      px-2 py-1 text-xs rounded border
                      ${strokeWidth === width
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {width}px
                  </button>
                ))}
              </div>

              {/* Visual Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Preview</p>
                <div className="bg-gray-50 rounded p-2 flex items-center justify-center">
                  <div
                    style={{
                      width: '100%',
                      height: `${strokeWidth}px`,
                      backgroundColor: strokeColor,
                      borderRadius: strokeWidth > 4 ? '4px' : '2px'
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tool Info */}
      <div className="mt-auto text-center px-2">
        <p className="text-xs text-gray-500 leading-tight">
          {activeTool === 'select' && 'Select & move'}
          {activeTool === 'pin' && 'Click to pin'}
          {activeTool === 'arrow' && 'Drag to draw'}
          {activeTool === 'circle' && 'Drag to draw'}
          {activeTool === 'rect' && 'Drag to draw'}
          {activeTool === 'freehand' && 'Draw freely'}
          {activeTool === 'text' && 'Click to place'}
        </p>
      </div>
    </div>
  );
}
