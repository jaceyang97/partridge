import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import { track } from '@vercel/analytics';

interface PlacedSquare {
  id: string;
  size: number;
  x: number;
  y: number;
  locked: boolean;
}

interface SquareCount {
  size: number;
  total: number;
  remaining: number;
}

const GRID_SIZE = 45;
const CELL_SIZE = 12; // pixels per grid cell
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;

// Color mapping for each square size
const SQUARE_COLORS: { [key: number]: string } = {
  1: '#000000',
  2: '#015436',
  3: '#F18402', 
  4: '#042E7D',
  5: '#900035',
  6: '#037CBB',
  7: '#F4C104',
  8: '#614530',
  9: '#C4CAC4'
};

// Preset configurations
const PRESETS: { [key: number]: PlacedSquare[] } = {
  1: [
    { id: 'preset-1-1', size: 9, x: 0, y: 9, locked: true },
    { id: 'preset-1-2', size: 9, x: 0, y: 18, locked: true },
    { id: 'preset-1-3', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-1-4', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-1-5', size: 8, x: 9, y: 37, locked: true },
    { id: 'preset-1-6', size: 8, x: 9, y: 29, locked: true },
    { id: 'preset-1-7', size: 5, x: 9, y: 24, locked: true },
    { id: 'preset-1-8', size: 5, x: 9, y: 19, locked: true },
    { id: 'preset-1-9', size: 6, x: 9, y: 13, locked: true },
    { id: 'preset-1-10', size: 7, x: 38, y: 38, locked: true },
    { id: 'preset-1-11', size: 7, x: 31, y: 38, locked: true },
    { id: 'preset-1-12', size: 8, x: 37, y: 30, locked: true },
    { id: 'preset-1-13', size: 8, x: 29, y: 30, locked: true },
    { id: 'preset-1-14', size: 8, x: 37, y: 22, locked: true },
    { id: 'preset-1-16', size: 7, x: 38, y: 15, locked: true },
    { id: 'preset-1-17', size: 7, x: 38, y: 8, locked: true },
    { id: 'preset-1-18', size: 8, x: 37, y: 0, locked: true },
    { id: 'preset-1-19', size: 4, x: 33, y: 0, locked: true },
    { id: 'preset-1-20', size: 4, x: 33, y: 4, locked: true },
    { id: 'preset-1-21', size: 9, x: 24, y: 0, locked: true },
    { id: 'preset-1-22', size: 9, x: 15, y: 0, locked: true },
    { id: 'preset-1-23', size: 4, x: 11, y: 0, locked: true },
    { id: 'preset-1-24', size: 3, x: 12, y: 4, locked: true },
    { id: 'preset-1-25', size: 5, x: 33, y: 8, locked: true },
    { id: 'preset-1-26', size: 9, x: 29, y: 13, locked: true },
  ],
  2: [
    { id: 'preset-2-1', size: 4, x: 0, y: 0, locked: true },
    { id: 'preset-2-2', size: 4, x: 4, y: 0, locked: true },
    { id: 'preset-2-3', size: 4, x: 8, y: 0, locked: true },
    { id: 'preset-2-4', size: 7, x: 12, y: 0, locked: true },
    { id: 'preset-2-5', size: 7, x: 19, y: 0, locked: true },
    { id: 'preset-2-6', size: 6, x: 26, y: 0, locked: true },
    { id: 'preset-2-7', size: 8, x: 32, y: 0, locked: true },
    { id: 'preset-2-8', size: 5, x: 40, y: 0, locked: true },
    { id: 'preset-2-9', size: 5, x: 40, y: 5, locked: true },
    { id: 'preset-2-10', size: 9, x: 0, y: 4, locked: true },
    { id: 'preset-2-11', size: 3, x: 9, y: 4, locked: true },
    { id: 'preset-2-12', size: 8, x: 0, y: 13, locked: true },
    { id: 'preset-2-13', size: 8, x: 8, y: 13, locked: true },
    { id: 'preset-2-14', size: 9, x: 36, y: 10, locked: true },
    { id: 'preset-2-15', size: 9, x: 36, y: 19, locked: true },
    { id: 'preset-2-16', size: 9, x: 27, y: 19, locked: true },
    { id: 'preset-2-17', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-2-18', size: 9, x: 9, y: 36, locked: true },
    { id: 'preset-2-19', size: 9, x: 18, y: 36, locked: true },
    { id: 'preset-2-20', size: 9, x: 27, y: 36, locked: true },
    { id: 'preset-2-21', size: 9, x: 36, y: 36, locked: true },
    { id: 'preset-2-22', size: 7, x: 0, y: 29, locked: true },
    { id: 'preset-2-23', size: 7, x: 7, y: 29, locked: true },
    { id: 'preset-2-24', size: 7, x: 14, y: 29, locked: true },
    { id: 'preset-2-25', size: 8, x: 21, y: 28, locked: true },
    { id: 'preset-2-26', size: 8, x: 29, y: 28, locked: true },
    { id: 'preset-2-27', size: 8, x: 37, y: 28, locked: true },
    { id: 'preset-2-28', size: 5, x: 16, y: 24, locked: true },
    { id: 'preset-2-29', size: 3, x: 21, y: 25, locked: true },
  ],
  3: [
    { id: 'preset-3-1', size: 9, x: 0, y: 0, locked: true },
    { id: 'preset-3-2', size: 9, x: 0, y: 9, locked: true },
    { id: 'preset-3-3', size: 9, x: 0, y: 18, locked: true },
    { id: 'preset-3-4', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-3-5', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-3-6', size: 8, x: 9, y: 0, locked: true },
    { id: 'preset-3-7', size: 8, x: 9, y: 8, locked: true },
    { id: 'preset-3-8', size: 7, x: 9, y: 16, locked: true },
    { id: 'preset-3-9', size: 9, x: 17, y: 0, locked: true },
    { id: 'preset-3-10', size: 7, x: 17, y: 9, locked: true },
    { id: 'preset-3-11', size: 5, x: 26, y: 0, locked: true },
    { id: 'preset-3-12', size: 4, x: 26, y: 5, locked: true },
    { id: 'preset-3-13', size: 2, x: 30, y: 5, locked: true },
    { id: 'preset-3-14', size: 9, x: 36, y: 0, locked: true },
    { id: 'preset-3-15', size: 7, x: 9, y: 38, locked: true },
    { id: 'preset-3-16', size: 6, x: 16, y: 39, locked: true },
    { id: 'preset-3-17', size: 6, x: 22, y: 39, locked: true },
    { id: 'preset-3-18', size: 7, x: 16, y: 32, locked: true },
    { id: 'preset-3-19', size: 5, x: 23, y: 34, locked: true },
    { id: 'preset-3-20', size: 5, x: 23, y: 29, locked: true },
    { id: 'preset-3-21', size: 3, x: 20, y: 29, locked: true },
    { id: 'preset-3-22', size: 9, x: 28, y: 27, locked: true },
    { id: 'preset-3-23', size: 9, x: 28, y: 36, locked: true },
    { id: 'preset-3-24', size: 4, x: 41, y: 41, locked: true },
    { id: 'preset-3-25', size: 4, x: 37, y: 41, locked: true },
    { id: 'preset-3-26', size: 8, x: 37, y: 33, locked: true },
    { id: 'preset-3-27', size: 8, x: 37, y: 25, locked: true },
    { id: 'preset-3-28', size: 8, x: 37, y: 17, locked: true },
    { id: 'preset-3-29', size: 6, x: 31, y: 15, locked: true },
    { id: 'preset-3-30', size: 6, x: 31, y: 21, locked: true },
    { id: 'preset-3-31', size: 3, x: 28, y: 24, locked: true },
  ],
  4: [
    { id: 'preset-4-1', size: 9, x: 0, y: 0, locked: true },
    { id: 'preset-4-2', size: 9, x: 9, y: 0, locked: true },
    { id: 'preset-4-3', size: 8, x: 0, y: 9, locked: true },
    { id: 'preset-4-4', size: 5, x: 0, y: 17, locked: true },
    { id: 'preset-4-5', size: 5, x: 0, y: 22, locked: true },
    { id: 'preset-4-6', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-4-7', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-4-8', size: 9, x: 9, y: 36, locked: true },
    { id: 'preset-4-9', size: 9, x: 18, y: 36, locked: true },
    { id: 'preset-4-10', size: 6, x: 18, y: 0, locked: true },
    { id: 'preset-4-11', size: 6, x: 18, y: 6, locked: true },
    { id: 'preset-4-12', size: 7, x: 8, y: 9, locked: true },
    { id: 'preset-4-13', size: 3, x: 15, y: 9, locked: true },
    { id: 'preset-4-14', size: 3, x: 5, y: 17, locked: true },
    { id: 'preset-4-15', size: 4, x: 8, y: 16, locked: true },
    { id: 'preset-4-16', size: 7, x: 5, y: 20, locked: true },
    { id: 'preset-4-17', size: 7, x: 31, y: 0, locked: true },
    { id: 'preset-4-18', size: 7, x: 38, y: 0, locked: true },
    { id: 'preset-4-19', size: 8, x: 37, y: 7, locked: true },
    { id: 'preset-4-20', size: 8, x: 37, y: 15, locked: true },
    { id: 'preset-4-21', size: 8, x: 37, y: 23, locked: true },
    { id: 'preset-4-22', size: 8, x: 37, y: 31, locked: true },
    { id: 'preset-4-23', size: 6, x: 33, y: 39, locked: true },
    { id: 'preset-4-24', size: 6, x: 39, y: 39, locked: true },
    { id: 'preset-4-25', size: 4, x: 33, y: 15, locked: true },
    { id: 'preset-4-26', size: 9, x: 28, y: 19, locked: true },
    { id: 'preset-4-27', size: 5, x: 32, y: 28, locked: true },
    { id: 'preset-4-28', size: 2, x: 35, y: 33, locked: true },
    { id: 'preset-4-29', size: 4, x: 33, y: 35, locked: true },
  ],
  5: [
    { id: 'preset-5-1', size: 4, x: 0, y: 2, locked: true },
    { id: 'preset-5-2', size: 7, x: 0, y: 6, locked: true },
    { id: 'preset-5-3', size: 7, x: 0, y: 13, locked: true },
    { id: 'preset-5-4', size: 5, x: 7, y: 6, locked: true },
    { id: 'preset-5-5', size: 5, x: 12, y: 6, locked: true },
    { id: 'preset-5-6', size: 9, x: 7, y: 11, locked: true },
    { id: 'preset-5-7', size: 8, x: 0, y: 20, locked: true },
    { id: 'preset-5-8', size: 8, x: 8, y: 20, locked: true },
    { id: 'preset-5-9', size: 8, x: 0, y: 28, locked: true },
    { id: 'preset-5-10', size: 8, x: 8, y: 28, locked: true },
    { id: 'preset-5-11', size: 8, x: 16, y: 28, locked: true },
    { id: 'preset-5-12', size: 9, x: 9, y: 36, locked: true },
    { id: 'preset-5-13', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-5-14', size: 7, x: 22, y: 0, locked: true },
    { id: 'preset-5-15', size: 7, x: 29, y: 0, locked: true },
    { id: 'preset-5-16', size: 9, x: 36, y: 0, locked: true },
    { id: 'preset-5-17', size: 5, x: 31, y: 7, locked: true },
    { id: 'preset-5-18', size: 3, x: 42, y: 12, locked: true },
    { id: 'preset-5-19', size: 6, x: 39, y: 15, locked: true },
    { id: 'preset-5-20', size: 4, x: 33, y: 25, locked: true },
    { id: 'preset-5-21', size: 8, x: 37, y: 21, locked: true },
    { id: 'preset-5-22', size: 7, x: 31, y: 29, locked: true },
    { id: 'preset-5-23', size: 7, x: 38, y: 29, locked: true },
    { id: 'preset-5-24', size: 9, x: 36, y: 36, locked: true },
  ],
  6: [
    { id: 'preset-6-1', size: 9, x: 0, y: 0, locked: true },
    { id: 'preset-6-2', size: 9, x: 0, y: 9, locked: true },
    { id: 'preset-6-3', size: 9, x: 0, y: 18, locked: true },
    { id: 'preset-6-4', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-6-5', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-6-6', size: 4, x: 9, y: 0, locked: true },
    { id: 'preset-6-7', size: 4, x: 13, y: 0, locked: true },
    { id: 'preset-6-8', size: 7, x: 17, y: 0, locked: true },
    { id: 'preset-6-9', size: 7, x: 24, y: 0, locked: true },
    { id: 'preset-6-10', size: 7, x: 31, y: 0, locked: true },
    { id: 'preset-6-11', size: 7, x: 38, y: 0, locked: true },
    { id: 'preset-6-12', size: 8, x: 9, y: 37, locked: true },
    { id: 'preset-6-13', size: 8, x: 9, y: 29, locked: true },
    { id: 'preset-6-14', size: 3, x: 9, y: 26, locked: true },
    { id: 'preset-6-15', size: 9, x: 17, y: 36, locked: true },
    { id: 'preset-6-16', size: 7, x: 17, y: 29, locked: true },
    { id: 'preset-6-17', size: 8, x: 25, y: 7, locked: true },
    { id: 'preset-6-18', size: 6, x: 39, y: 7, locked: true },
    { id: 'preset-6-19', size: 6, x: 33, y: 7, locked: true },
    { id: 'preset-6-20', size: 9, x: 36, y: 13, locked: true },
    { id: 'preset-6-21', size: 2, x: 34, y: 20, locked: true },
    { id: 'preset-6-22', size: 7, x: 32, y: 22, locked: true },
    { id: 'preset-6-23', size: 6, x: 39, y: 22, locked: true },
    { id: 'preset-6-24', size: 6, x: 39, y: 28, locked: true },
    { id: 'preset-6-25', size: 6, x: 39, y: 34, locked: true },
    { id: 'preset-6-26', size: 5, x: 40, y: 40, locked: true },
    { id: 'preset-6-27', size: 5, x: 35, y: 40, locked: true },
  ],
  7: [
    { id: 'preset-7-1', size: 9, x: 0, y: 0, locked: true },
    { id: 'preset-7-2', size: 9, x: 0, y: 9, locked: true },
    { id: 'preset-7-3', size: 9, x: 0, y: 18, locked: true },
    { id: 'preset-7-4', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-7-5', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-7-6', size: 7, x: 9, y: 0, locked: true },
    { id: 'preset-7-7', size: 8, x: 9, y: 7, locked: true },
    { id: 'preset-7-8', size: 7, x: 9, y: 15, locked: true },
    { id: 'preset-7-9', size: 7, x: 9, y: 22, locked: true },
    { id: 'preset-7-10', size: 8, x: 9, y: 29, locked: true },
    { id: 'preset-7-11', size: 8, x: 9, y: 37, locked: true },
    { id: 'preset-7-12', size: 3, x: 17, y: 12, locked: true },
    { id: 'preset-7-13', size: 7, x: 16, y: 15, locked: true },
    { id: 'preset-7-14', size: 7, x: 17, y: 29, locked: true },
    { id: 'preset-7-15', size: 9, x: 17, y: 36, locked: true },
    { id: 'preset-7-16', size: 6, x: 22, y: 0, locked: true },
    { id: 'preset-7-17', size: 9, x: 28, y: 0, locked: true },
    { id: 'preset-7-18', size: 8, x: 37, y: 0, locked: true },
    { id: 'preset-7-19', size: 4, x: 41, y: 16, locked: true },
    { id: 'preset-7-20', size: 8, x: 37, y: 20, locked: true },
    { id: 'preset-7-21', size: 8, x: 37, y: 28, locked: true },
    { id: 'preset-7-22', size: 9, x: 36, y: 36, locked: true },
    { id: 'preset-7-23', size: 5, x: 31, y: 40, locked: true },
    { id: 'preset-7-24', size: 5, x: 26, y: 40, locked: true },
    { id: 'preset-7-25', size: 2, x: 34, y: 38, locked: true },
    { id: 'preset-7-26', size: 4, x: 26, y: 36, locked: true },
  ],
  8: [
    { id: 'preset-8-1', size: 9, x: 0, y: 0, locked: true },
    { id: 'preset-8-2', size: 9, x: 0, y: 9, locked: true },
    { id: 'preset-8-3', size: 9, x: 0, y: 18, locked: true },
    { id: 'preset-8-4', size: 9, x: 0, y: 27, locked: true },
    { id: 'preset-8-5', size: 9, x: 9, y: 0, locked: true },
    { id: 'preset-8-6', size: 9, x: 18, y: 0, locked: true },
    { id: 'preset-8-7', size: 7, x: 9, y: 9, locked: true },
    { id: 'preset-8-8', size: 7, x: 9, y: 16, locked: true },
    { id: 'preset-8-9', size: 6, x: 16, y: 9, locked: true },
    { id: 'preset-8-10', size: 6, x: 16, y: 15, locked: true },
    { id: 'preset-8-11', size: 7, x: 22, y: 14, locked: true },
    { id: 'preset-8-12', size: 5, x: 22, y: 9, locked: true },
    { id: 'preset-8-13', size: 8, x: 16, y: 21, locked: true },
    { id: 'preset-8-14', size: 4, x: 27, y: 0, locked: true },
    { id: 'preset-8-15', size: 5, x: 31, y: 0, locked: true },
    { id: 'preset-8-16', size: 9, x: 36, y: 0, locked: true },
    { id: 'preset-8-17', size: 2, x: 34, y: 5, locked: true },
    { id: 'preset-8-18', size: 7, x: 38, y: 9, locked: true },
    { id: 'preset-8-19', size: 7, x: 38, y: 16, locked: true },
    { id: 'preset-8-20', size: 8, x: 37, y: 23, locked: true },
    { id: 'preset-8-21', size: 3, x: 42, y: 34, locked: true },
    { id: 'preset-8-22', size: 8, x: 37, y: 37, locked: true },
    { id: 'preset-8-23', size: 8, x: 29, y: 37, locked: true },
    { id: 'preset-8-24', size: 4, x: 25, y: 41, locked: true },
  ],
  9: [
    { id: 'preset-9-1', size: 6, x: 0, y: 0, locked: true },
    { id: 'preset-9-2', size: 6, x: 6, y: 0, locked: true },
    { id: 'preset-9-3', size: 6, x: 12, y: 0, locked: true },
    { id: 'preset-9-4', size: 5, x: 18, y: 0, locked: true },
    { id: 'preset-9-5', size: 4, x: 23, y: 0, locked: true },
    { id: 'preset-9-6', size: 8, x: 0, y: 6, locked: true },
    { id: 'preset-9-7', size: 8, x: 8, y: 6, locked: true },
    { id: 'preset-9-8', size: 9, x: 0, y: 36, locked: true },
    { id: 'preset-9-9', size: 9, x: 9, y: 36, locked: true },
    { id: 'preset-9-10', size: 9, x: 18, y: 36, locked: true },
    { id: 'preset-9-11', size: 9, x: 27, y: 36, locked: true },
    { id: 'preset-9-12', size: 9, x: 36, y: 36, locked: true },
    { id: 'preset-9-13', size: 7, x: 0, y: 29, locked: true },
    { id: 'preset-9-14', size: 7, x: 0, y: 22, locked: true },
    { id: 'preset-9-15', size: 8, x: 7, y: 28, locked: true },
    { id: 'preset-9-16', size: 8, x: 15, y: 28, locked: true },
    { id: 'preset-9-17', size: 8, x: 23, y: 28, locked: true },
    { id: 'preset-9-18', size: 9, x: 36, y: 18, locked: true },
    { id: 'preset-9-19', size: 9, x: 36, y: 27, locked: true },
    { id: 'preset-9-20', size: 5, x: 31, y: 31, locked: true },
    { id: 'preset-9-21', size: 5, x: 31, y: 26, locked: true },
    { id: 'preset-9-22', size: 5, x: 31, y: 21, locked: true },
    { id: 'preset-9-23', size: 7, x: 24, y: 21, locked: true },
    { id: 'preset-9-24', size: 4, x: 20, y: 24, locked: true },
    { id: 'preset-9-25', size: 3, x: 7, y: 25, locked: true },
  ],
};

function App() {
  // Track page view on component mount
  useEffect(() => {
    track('app_loaded');
  }, []);

  // Calculate remaining counts after subtracting preset squares
  const getInitialCounts = (presetSquares: PlacedSquare[] = []) => {
    const presetCounts: { [key: number]: number } = {};
    presetSquares.forEach(square => {
      presetCounts[square.size] = (presetCounts[square.size] || 0) + 1;
    });

    return Array.from({ length: 9 }, (_, i) => {
      const size = i + 1;
      const total = size;
      const used = presetCounts[size] || 0;
      return {
        size,
        total,
        remaining: total - used,
      };
    });
  };

  // Initialize with empty board
  const [squareCounts, setSquareCounts] = useState<SquareCount[]>(getInitialCounts());
  const [placedSquares, setPlacedSquares] = useState<PlacedSquare[]>([]);
  const [currentPreset, setCurrentPreset] = useState<number>(0);
  const [draggedSquare, setDraggedSquare] = useState<{ size: number; id: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverBoard, setDragOverBoard] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number; size: number; valid: boolean } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, size: number, existingSquareId?: string) => {
    if (existingSquareId) {
      // Dragging an existing placed square
      setDraggedSquare({ size, id: existingSquareId });
    } else {
      // Dragging from toolbar
      const id = `square-${size}-${Date.now()}-${Math.random()}`;
      setDraggedSquare({ size, id });
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', size.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBoard(true);

    if (!draggedSquare || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate grid position with offset to center the square under the mouse
    const halfSquareSize = (draggedSquare.size * CELL_SIZE) / 2;
    const rawGridX = (x - halfSquareSize) / CELL_SIZE;
    const rawGridY = (y - halfSquareSize) / CELL_SIZE;
    
    // Snap to grid and ensure bounds
    const gridX = Math.max(0, Math.min(Math.round(rawGridX), GRID_SIZE - draggedSquare.size));
    const gridY = Math.max(0, Math.min(Math.round(rawGridY), GRID_SIZE - draggedSquare.size));

    // Check if placement would be valid
    const wouldFitInBounds = gridX >= 0 && gridY >= 0 && gridX + draggedSquare.size <= GRID_SIZE && gridY + draggedSquare.size <= GRID_SIZE;
    
    const wouldOverlap = placedSquares.some(square => {
      return !(
        gridX >= square.x + square.size ||
        gridX + draggedSquare.size <= square.x ||
        gridY >= square.y + square.size ||
        gridY + draggedSquare.size <= square.y
      );
    });

    const isValid = wouldFitInBounds && !wouldOverlap;

    setPreviewPosition({
      x: gridX,
      y: gridY,
      size: draggedSquare.size,
      valid: isValid
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set dragOverBoard to false if we're leaving the board itself, not a child element
    if (e.currentTarget === e.target) {
      setDragOverBoard(false);
      setPreviewPosition(null);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverBoard(false);
    setPreviewPosition(null);
    setDraggedSquare(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBoard(false);
    setPreviewPosition(null);
    
    if (!draggedSquare || !boardRef.current) {
      console.log('No dragged square or board ref');
      setIsDragging(false);
      setDraggedSquare(null);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use the same calculation as in handleDragOver
    const halfSquareSize = (draggedSquare.size * CELL_SIZE) / 2;
    const rawGridX = (x - halfSquareSize) / CELL_SIZE;
    const rawGridY = (y - halfSquareSize) / CELL_SIZE;
    
    // Snap to grid and ensure bounds
    const gridX = Math.max(0, Math.min(Math.round(rawGridX), GRID_SIZE - draggedSquare.size));
    const gridY = Math.max(0, Math.min(Math.round(rawGridY), GRID_SIZE - draggedSquare.size));

    // Check if square fits within bounds
    if (gridX < 0 || gridY < 0 || gridX + draggedSquare.size > GRID_SIZE || gridY + draggedSquare.size > GRID_SIZE) {
      console.log('Square does not fit within bounds');
      setIsDragging(false);
      setDraggedSquare(null);
      return;
    }

    // Check if this is an existing square being repositioned
    const existingSquare = placedSquares.find(s => s.id === draggedSquare.id);
    const isRepositioning = !!existingSquare;

    // Check for overlaps with existing squares (excluding the one being moved)
    const wouldOverlap = placedSquares.some(square => {
      if (isRepositioning && square.id === draggedSquare.id) return false; // Ignore the square being moved
      return !(
        gridX >= square.x + square.size ||
        gridX + draggedSquare.size <= square.x ||
        gridY >= square.y + square.size ||
        gridY + draggedSquare.size <= square.y
      );
    });

    if (wouldOverlap) {
      console.log('Square would overlap with existing square');
      setIsDragging(false);
      setDraggedSquare(null);
      return;
    }

    if (isRepositioning) {
      // Update existing square position
      console.log('Repositioning square:', draggedSquare.id);
      setPlacedSquares(prev =>
        prev.map(square =>
          square.id === draggedSquare.id
            ? { ...square, x: gridX, y: gridY }
            : square
        )
      );

      // Track square repositioning event
      track('square_repositioned', {
        size: draggedSquare.size,
        new_position: `${gridX},${gridY}`,
        total_squares: placedSquares.length
      });
    } else {
      // Place new square from toolbar
      const newSquare: PlacedSquare = {
        id: draggedSquare.id,
        size: draggedSquare.size,
        x: gridX,
        y: gridY,
        locked: false,
      };

      console.log('Placing new square:', newSquare);
      setPlacedSquares(prev => [...prev, newSquare]);
      setSquareCounts(prev =>
        prev.map(count =>
          count.size === draggedSquare.size
            ? { ...count, remaining: count.remaining - 1 }
            : count
        )
      );

      // Track square placement event
      track('square_placed', {
        size: draggedSquare.size,
        position: `${gridX},${gridY}`,
        total_squares: placedSquares.length + 1
      });
    }

    setIsDragging(false);
    setDraggedSquare(null);
  }, [draggedSquare, placedSquares]);

  const handleRightClick = (e: React.MouseEvent, squareId: string) => {
    e.preventDefault();
    
    const squareToRemove = placedSquares.find(s => s.id === squareId);
    if (!squareToRemove || squareToRemove.locked) return;

    // Track square removal event
    track('square_removed', {
      size: squareToRemove.size,
      total_squares: placedSquares.length - 1
    });

    setPlacedSquares(prev => prev.filter(s => s.id !== squareId));
    setSquareCounts(prev =>
      prev.map(count =>
        count.size === squareToRemove.size
          ? { ...count, remaining: count.remaining + 1 }
          : count
      )
    );
  };

  const handleSquareDoubleClick = (e: React.MouseEvent, squareId: string) => {
    e.preventDefault();
    
    setPlacedSquares(prev =>
      prev.map(square =>
        square.id === squareId
          ? { ...square, locked: !square.locked }
          : square
      )
    );
  };

  const handleReset = () => {
    // Get the current preset squares (if any)
    const presetSquares = PRESETS[currentPreset] || [];
    
    // Track board reset event
    track('board_reset', {
      preset: currentPreset,
      squares_placed: placedSquares.filter(s => !s.locked).length
    });
    
    // Reset to the current preset's initial state
    setPlacedSquares(presetSquares);
    setSquareCounts(getInitialCounts(presetSquares));
    setDraggedSquare(null);
    setIsDragging(false);
    setDragOverBoard(false);
    setPreviewPosition(null);
  };

  const handleLoadPreset = (presetNumber: number) => {
    const presetSquares = PRESETS[presetNumber] || [];
    
    // Track preset load event
    track('preset_loaded', {
      preset_number: presetNumber,
      preset_squares_count: presetSquares.length
    });
    
    setPlacedSquares(presetSquares);
    setSquareCounts(getInitialCounts(presetSquares));
    setCurrentPreset(presetNumber);
    setDraggedSquare(null);
    setIsDragging(false);
    setDragOverBoard(false);
    setPreviewPosition(null);
  };

  const handleDownloadBoard = () => {
    // Track board download event
    track('board_downloaded', {
      total_squares: placedSquares.length,
      preset: currentPreset
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = BOARD_SIZE;
    canvas.height = BOARD_SIZE;

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, BOARD_SIZE);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(BOARD_SIZE, pos);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Draw placed squares
    placedSquares.forEach(square => {
      const x = square.x * CELL_SIZE;
      const y = square.y * CELL_SIZE;
      const size = square.size * CELL_SIZE;

      // Fill square with color
      ctx.fillStyle = square.locked 
        ? `${SQUARE_COLORS[square.size]}CC` 
        : SQUARE_COLORS[square.size];
      ctx.fillRect(x, y, size, size);

      // Draw square border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, size, size);

      // Draw size number
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(8, size / 4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 2;
      
      ctx.fillText(square.size.toString(), x + size / 2, y + size / 2);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partridge-tiling-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="app">
      <div className="creator-info">
        <span>Created by </span>
        <a href="https://www.jaceyang.com" target="_blank" rel="noopener noreferrer">
          Jace Yang
        </a>
        <a href="https://github.com/jaceyang97" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </div>
      
      <div className="header">
        <h1>Partridge Tiling (45x45)</h1>
        <p className="subtitle">
          Interactive solver for <a href="https://www.janestreet.com/static/pdfs/puzzles/june-2025-puzzle.pdf" target="_blank" rel="noopener noreferrer">Jane Street June 2025 Puzzle</a>
        </p>
        
        <div className="useful-links">
          <p><strong>Useful Links:</strong></p>
          <ul>
            <li><a href="https://pyrigan.com/2017/02/17/the-partridge-puzzle/" target="_blank" rel="noopener noreferrer">The Partridge Puzzle by John Partridge</a></li>
            <li><a href="http://www.recmath.org/PolyCur/contiguous/index.html" target="_blank" rel="noopener noreferrer">Contiguous Reverse Partridge Tilings</a></li>
            <li><a href="https://erich-friedman.github.io/mathmagic/0607.html" target="_blank" rel="noopener noreferrer">Math Magic: Anti-Partridge Tilings</a></li>
            <li><a href="https://en.wikipedia.org/wiki/Square_triangular_number" target="_blank" rel="noopener noreferrer">Square Triangular Numbers - Wikipedia</a></li>
          </ul>
        </div>
        
        <div className="instructions">
          <p><strong>How to use:</strong></p>
          <ul>
            <li>Drag squares to board</li>
            <li>Green=valid, Red=invalid</li>
            <li>Right-click to remove</li>
            <li>Double-click to lock/unlock</li>
          </ul>
        </div>
        
        <div className="related-section">
          <p><strong>You may also be interested in:</strong></p>
          <ul>
            <li>
              <a href="https://jspuzzle-lb.vercel.app/" target="_blank" rel="noopener noreferrer">
                Puzzle Leaderboard
              </a> - Rankings for Jane Street puzzles
            </li>
          </ul>
        </div>
      </div>
      
      <div className="game-container">
        <div className="board-container">
          <div className="preset-controls">
            <select 
              id="preset-select"
              className="preset-select" 
              value={currentPreset} 
              onChange={(e) => handleLoadPreset(Number(e.target.value))}
            >
              <option value={0}>Empty</option>
              {Object.keys(PRESETS).map(presetNum => (
                <option key={presetNum} value={presetNum}>
                  Preset {presetNum}
                </option>
              ))}
            </select>
            
            <button className="icon-button download-button" onClick={handleDownloadBoard} title="Download PNG">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.577l-3.539-3.539-1.415 1.414L12 18.406l4.954-4.954-1.414-1.414L12 15.577zM12 2v13h-2V2h2zM2 20h20v2H2v-2z"/>
              </svg>
            </button>
            
            <button className="icon-button reset-button" onClick={handleReset} title="Clear Board">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
              </svg>
            </button>
          </div>
          
          <div
            ref={boardRef}
            className={`board ${dragOverBoard ? 'drag-over' : ''}`}
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            {/* Grid lines */}
            <svg className="grid-lines" width={BOARD_SIZE} height={BOARD_SIZE}>
              {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={i * CELL_SIZE}
                    y1={0}
                    x2={i * CELL_SIZE}
                    y2={BOARD_SIZE}
                    stroke="#ddd"
                    strokeWidth={0.5}
                  />
                  <line
                    x1={0}
                    y1={i * CELL_SIZE}
                    x2={BOARD_SIZE}
                    y2={i * CELL_SIZE}
                    stroke="#ddd"
                    strokeWidth={0.5}
                  />
                </g>
              ))}
            </svg>

            {/* Placed squares */}
            {placedSquares.map(square => (
              <div
                key={square.id}
                className={`placed-square ${square.locked ? 'locked' : ''}`}
                style={{
                  left: square.x * CELL_SIZE,
                  top: square.y * CELL_SIZE,
                  width: square.size * CELL_SIZE,
                  height: square.size * CELL_SIZE,
                  backgroundColor: square.locked 
                    ? `${SQUARE_COLORS[square.size]}CC` // Add transparency for locked
                    : SQUARE_COLORS[square.size],
                  opacity: square.locked ? 0.8 : 1,
                }}
                draggable={!square.locked}
                onDragStart={(e) => !square.locked && handleDragStart(e, square.size, square.id)}
                onDragEnd={handleDragEnd}
                onContextMenu={(e) => handleRightClick(e, square.id)}
                onDoubleClick={(e) => handleSquareDoubleClick(e, square.id)}
              >
                {square.size}
              </div>
            ))}

            {/* Preview square */}
            {previewPosition && (
              <div
                className={`preview-square ${previewPosition.valid ? 'valid' : 'invalid'}`}
                style={{
                  left: previewPosition.x * CELL_SIZE,
                  top: previewPosition.y * CELL_SIZE,
                  width: previewPosition.size * CELL_SIZE,
                  height: previewPosition.size * CELL_SIZE,
                }}
              />
            )}
          </div>
        </div>

        <div className="toolbar-section">
          <div className="toolbar">
            <div className="remaining-label">Remaining</div>
            {squareCounts.map(({ size, remaining }) => (
              <div key={size} className="toolbar-square-container">
                <div className="toolbar-square-area">
                  <div
                    className={`toolbar-square ${isDragging && draggedSquare?.size === size ? 'dragging' : ''} ${remaining === 0 ? 'exhausted' : ''}`}
                    style={{
                      width: size * CELL_SIZE,
                      height: size * CELL_SIZE,
                      backgroundColor: remaining > 0 ? SQUARE_COLORS[size] : '#cccccc',
                      opacity: remaining > 0 ? 1 : 0.5,
                    }}
                    draggable={remaining > 0}
                    onDragStart={(e) => remaining > 0 && handleDragStart(e, size)}
                    onDragEnd={handleDragEnd}
                  >
                    {remaining === 0 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="check-icon">
                        <path 
                          d="M20 6L9 17L4 12" 
                          stroke="#10b981" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      size
                    )}
                  </div>
                </div>
                <div className="remaining-count">{remaining}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
