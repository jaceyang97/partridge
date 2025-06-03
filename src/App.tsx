import React, { useState, useRef, useCallback } from 'react';
import './App.css';

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
  1: 'purple',
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
  ],
  3: [
  ],
  4: [
  ],
  5: [
  ],
  6: [
  ],
  7: [
  ],
  8: [
  ],
  9: [
  ],
};

function App() {
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

  const handleDragStart = (e: React.DragEvent, size: number) => {
    const id = `square-${size}-${Date.now()}-${Math.random()}`;
    setDraggedSquare({ size, id });
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

    // Check for overlaps with existing squares
    const wouldOverlap = placedSquares.some(square => {
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

    // Place the square
    const newSquare: PlacedSquare = {
      id: draggedSquare.id,
      size: draggedSquare.size,
      x: gridX,
      y: gridY,
      locked: false,
    };

    console.log('Placing square:', newSquare);
    setPlacedSquares(prev => [...prev, newSquare]);
    setSquareCounts(prev =>
      prev.map(count =>
        count.size === draggedSquare.size
          ? { ...count, remaining: count.remaining - 1 }
          : count
      )
    );

    setIsDragging(false);
    setDraggedSquare(null);
  }, [draggedSquare, placedSquares]);

  const handleRightClick = (e: React.MouseEvent, squareId: string) => {
    e.preventDefault();
    
    const squareToRemove = placedSquares.find(s => s.id === squareId);
    if (!squareToRemove || squareToRemove.locked) return;

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
    setPlacedSquares(presetSquares);
    setSquareCounts(getInitialCounts(presetSquares));
    setCurrentPreset(presetNumber);
    setDraggedSquare(null);
    setIsDragging(false);
    setDragOverBoard(false);
    setPreviewPosition(null);
  };

  const handleDownloadBoard = () => {
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
