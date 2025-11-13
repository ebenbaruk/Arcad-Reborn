'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Position {
  x: number;
  y: number;
}

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
}

const TETROMINOS: Record<TetrominoType, Omit<Tetromino, 'type'>> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f0f0',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000',
  },
};

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    grid: [] as number[][],
    gridColors: [] as string[][],
    currentPiece: null as (Tetromino & { position: Position }) | null,
    nextPiece: null as Tetromino | null,
    dropCounter: 0,
    dropInterval: 1000,
    lastTime: 0,
    rows: 20,
    cols: 10,
    blockSize: 30,
  });

  const createEmptyGrid = useCallback(() => {
    const { rows, cols } = gameStateRef.current;
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  }, []);

  const createEmptyColorGrid = useCallback(() => {
    const { rows, cols } = gameStateRef.current;
    return Array.from({ length: rows }, () => Array(cols).fill(''));
  }, []);

  const createTetromino = useCallback((type?: TetrominoType): Tetromino => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const selectedType = type || types[Math.floor(Math.random() * types.length)];
    return {
      type: selectedType,
      ...TETROMINOS[selectedType],
    };
  }, []);

  const rotate = useCallback((piece: number[][]): number[][] => {
    const newPiece = piece.map((_, i) =>
      piece.map(row => row[i])
    );
    return newPiece.map(row => row.reverse());
  }, []);

  const checkCollision = useCallback((piece: Tetromino, position: Position, grid: number[][]): boolean => {
    const { rows, cols } = gameStateRef.current;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;

          if (newX < 0 || newX >= cols || newY >= rows) {
            return true;
          }

          if (newY >= 0 && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback(() => {
    const { currentPiece, grid, gridColors } = gameStateRef.current;
    if (!currentPiece) return;

    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = currentPiece.position.y + y;
          const newX = currentPiece.position.x + x;
          if (newY >= 0) {
            grid[newY][newX] = 1;
            gridColors[newY][newX] = currentPiece.color;
          }
        }
      });
    });
  }, []);

  const clearLines = useCallback((): number => {
    const { grid, gridColors, cols } = gameStateRef.current;
    let linesCleared = 0;

    for (let y = grid.length - 1; y >= 0; y--) {
      if (grid[y].every(cell => cell !== 0)) {
        grid.splice(y, 1);
        grid.unshift(Array(cols).fill(0));
        gridColors.splice(y, 1);
        gridColors.unshift(Array(cols).fill(''));
        linesCleared++;
        y++;
      }
    }

    return linesCleared;
  }, []);

  const spawnPiece = useCallback(() => {
    const { cols, nextPiece } = gameStateRef.current;

    const piece = nextPiece || createTetromino();
    gameStateRef.current.nextPiece = createTetromino();

    const position = {
      x: Math.floor(cols / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0,
    };

    gameStateRef.current.currentPiece = { ...piece, position };

    if (checkCollision(piece, position, gameStateRef.current.grid)) {
      setGameOver(true);
      setHighScore(prev => Math.max(prev, score));
      return false;
    }
    return true;
  }, [createTetromino, checkCollision, score]);

  const moveDown = useCallback((): boolean => {
    const { currentPiece, grid } = gameStateRef.current;
    if (!currentPiece) return false;

    const newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 };

    if (!checkCollision(currentPiece, newPosition, grid)) {
      currentPiece.position = newPosition;
      return true;
    } else {
      mergePiece();
      const linesCleared = clearLines();

      if (linesCleared > 0) {
        setLines(l => {
          const newLines = l + linesCleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });

        const points = [0, 100, 300, 500, 800][linesCleared];
        setScore(s => s + points * level);
      }

      return spawnPiece();
    }
  }, [checkCollision, mergePiece, clearLines, spawnPiece, level]);

  const moveHorizontal = useCallback((direction: number) => {
    const { currentPiece, grid } = gameStateRef.current;
    if (!currentPiece) return;

    const newPosition = { ...currentPiece.position, x: currentPiece.position.x + direction };

    if (!checkCollision(currentPiece, newPosition, grid)) {
      currentPiece.position = newPosition;
    }
  }, [checkCollision]);

  const rotatePiece = useCallback(() => {
    const { currentPiece, grid } = gameStateRef.current;
    if (!currentPiece) return;

    const rotated = rotate(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(rotatedPiece, currentPiece.position, grid)) {
      currentPiece.shape = rotated;
    }
  }, [rotate, checkCollision]);

  const hardDrop = useCallback(() => {
    const { currentPiece, grid } = gameStateRef.current;
    if (!currentPiece) return;

    let dropDistance = 0;
    while (true) {
      const newPosition = { ...currentPiece.position, y: currentPiece.position.y + dropDistance + 1 };
      if (checkCollision(currentPiece, newPosition, grid)) {
        break;
      }
      dropDistance++;
    }

    currentPiece.position.y += dropDistance;
    setScore(s => s + dropDistance * 2);
    moveDown();
  }, [checkCollision, moveDown]);

  const startGame = useCallback(() => {
    gameStateRef.current.grid = createEmptyGrid();
    gameStateRef.current.gridColors = createEmptyColorGrid();
    gameStateRef.current.nextPiece = createTetromino();
    gameStateRef.current.dropInterval = 1000;

    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);

    spawnPiece();
  }, [createEmptyGrid, createEmptyColorGrid, createTetromino, spawnPiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 700;
    canvas.height = 620;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          gameStateRef.current.dropCounter = 0;
          setScore(s => s + 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let animationFrameId: number;

    const gameLoop = (time: number = 0) => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (!gameStarted || gameOver) {
        draw(ctx, canvas);
        return;
      }

      const deltaTime = time - gameStateRef.current.lastTime;
      gameStateRef.current.lastTime = time;
      gameStateRef.current.dropCounter += deltaTime;

      gameStateRef.current.dropInterval = Math.max(100, 1000 - (level - 1) * 100);

      if (gameStateRef.current.dropCounter > gameStateRef.current.dropInterval) {
        moveDown();
        gameStateRef.current.dropCounter = 0;
      }

      draw(ctx, canvas);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const { grid, gridColors, currentPiece, nextPiece, blockSize, rows, cols } = gameStateRef.current;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gridWidth = cols * blockSize;
      const gridHeight = rows * blockSize;
      const offsetX = 200; // Center the grid
      const offsetY = 10;

      // Draw scores on the left
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('SCORE', 40, 60);
      ctx.font = '28px Arial';
      ctx.fillText(score.toString(), 40, 95);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('LINES', 40, 150);
      ctx.font = '24px Arial';
      ctx.fillText(lines.toString(), 40, 180);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('LEVEL', 40, 230);
      ctx.font = '24px Arial';
      ctx.fillText(level.toString(), 40, 260);

      ctx.font = '14px Arial';
      ctx.fillStyle = '#999999';
      ctx.fillText('HIGH SCORE', 40, 320);
      ctx.font = '18px Arial';
      ctx.fillText(highScore.toString(), 40, 345);

      // Draw grid
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * blockSize);
        ctx.lineTo(offsetX + gridWidth, offsetY + y * blockSize);
        ctx.stroke();
      }
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * blockSize, offsetY);
        ctx.lineTo(offsetX + x * blockSize, offsetY + gridHeight);
        ctx.stroke();
      }

      // Draw placed blocks
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y][x]) {
            ctx.fillStyle = gridColors[y][x];
            ctx.fillRect(
              offsetX + x * blockSize + 1,
              offsetY + y * blockSize + 1,
              blockSize - 2,
              blockSize - 2
            );
          }
        }
      }

      // Draw current piece
      if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              const drawX = offsetX + (currentPiece.position.x + x) * blockSize;
              const drawY = offsetY + (currentPiece.position.y + y) * blockSize;
              ctx.fillRect(drawX + 1, drawY + 1, blockSize - 2, blockSize - 2);
            }
          });
        });
      }

      // Draw next piece preview on the right
      if (nextPiece) {
        const previewX = 540;
        const previewY = 80;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('NEXT', previewX, 60);

        // Draw preview box
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX - 5, previewY - 5, 90, 90);

        ctx.fillStyle = nextPiece.color;
        const pieceSize = nextPiece.shape.length;
        const offsetXPiece = previewX + (80 - pieceSize * 20) / 2;
        const offsetYPiece = previewY + (80 - pieceSize * 20) / 2;

        nextPiece.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              ctx.fillRect(
                offsetXPiece + x * 20 + 1,
                offsetYPiece + y * 20 + 1,
                18,
                18
              );
            }
          });
        });
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, level, moveHorizontal, moveDown, rotatePiece, hardDrop]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-8 min-h-screen">
        <div className="mb-3 flex items-center justify-between w-full max-w-[700px]">
          <Link
            href="/"
            className="text-purple-300 hover:text-purple-100 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Tetris</h1>
          <div className="w-32" />
        </div>

        <div className="mb-6 text-center text-purple-200">
          <p>Clear lines to score points and level up!</p>
        </div>

      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Tetris</h2>
              <div className="space-y-3 text-xl">
                <p>← → Arrow keys to move</p>
                <p>↑ Arrow key to rotate</p>
                <p>↓ Arrow key for soft drop</p>
                <p>SPACE for hard drop</p>
              </div>
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-4">Game Over</h2>
              <p className="text-3xl">Final Score: {score}</p>
              <p className="text-2xl">Lines Cleared: {lines}</p>
              <p className="text-2xl">Level: {level}</p>
              {score === highScore && score > 0 && (
                <p className="text-xl text-yellow-400">New High Score!</p>
              )}
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
