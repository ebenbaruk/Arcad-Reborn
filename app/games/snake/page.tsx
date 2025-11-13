'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    snake: [] as Position[],
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    food: { x: 0, y: 0 } as Position,
    gridSize: 20,
    tileCount: 30,
    speed: 100,
  });

  const initGame = useCallback(() => {
    const { tileCount } = gameStateRef.current;
    const centerX = Math.floor(tileCount / 2);
    const centerY = Math.floor(tileCount / 2);

    gameStateRef.current.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];
    gameStateRef.current.direction = 'RIGHT';
    gameStateRef.current.nextDirection = 'RIGHT';
    gameStateRef.current.speed = 100;
    generateFood();
  }, []);

  const generateFood = useCallback(() => {
    const { tileCount, snake } = gameStateRef.current;
    let newFood: Position;

    do {
      newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    gameStateRef.current.food = newFood;
  }, []);

  const startGame = useCallback(() => {
    initGame();
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent arrow keys from scrolling the page
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver) return;

      const { direction, nextDirection } = gameStateRef.current;
      const currentDir = nextDirection;

      switch (e.key) {
        case 'ArrowUp':
          if (currentDir !== 'DOWN') {
            gameStateRef.current.nextDirection = 'UP';
          }
          break;
        case 'ArrowDown':
          if (currentDir !== 'UP') {
            gameStateRef.current.nextDirection = 'DOWN';
          }
          break;
        case 'ArrowLeft':
          if (currentDir !== 'RIGHT') {
            gameStateRef.current.nextDirection = 'LEFT';
          }
          break;
        case 'ArrowRight':
          if (currentDir !== 'LEFT') {
            gameStateRef.current.nextDirection = 'RIGHT';
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let lastTime = 0;
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (!gameStarted || gameOver) {
        draw(ctx, canvas);
        return;
      }

      const deltaTime = currentTime - lastTime;

      if (deltaTime < gameStateRef.current.speed) {
        return;
      }

      lastTime = currentTime;

      const { snake, nextDirection, food, tileCount } = gameStateRef.current;

      // Update direction
      gameStateRef.current.direction = nextDirection;
      const direction = gameStateRef.current.direction;

      // Calculate new head position
      const head = { ...snake[0] };

      switch (direction) {
        case 'UP':
          head.y--;
          break;
        case 'DOWN':
          head.y++;
          break;
        case 'LEFT':
          head.x--;
          break;
        case 'RIGHT':
          head.x++;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      // Add new head
      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        generateFood();

        // Increase speed slightly
        gameStateRef.current.speed = Math.max(50, gameStateRef.current.speed - 2);
      } else {
        // Remove tail if no food eaten
        snake.pop();
      }

      draw(ctx, canvas);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const { snake, food, gridSize } = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw food
      ctx.fillStyle = '#ff4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4444';
      ctx.fillRect(
        food.x * gridSize + 2,
        food.y * gridSize + 2,
        gridSize - 4,
        gridSize - 4
      );
      ctx.shadowBlur = 0;

      // Draw snake
      snake.forEach((segment, index) => {
        if (index === 0) {
          // Head
          ctx.fillStyle = '#00ff00';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ff00';
        } else {
          // Body
          ctx.fillStyle = '#00cc00';
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#00cc00';
        }

        ctx.fillRect(
          segment.x * gridSize + 1,
          segment.y * gridSize + 1,
          gridSize - 2,
          gridSize - 2
        );
      });
      ctx.shadowBlur = 0;
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, score, generateFood]);

  return (
    <div className="min-h-screen bg-[#EAE7E0] flex flex-col items-center justify-center p-8">
      <div className="mb-3 flex items-center justify-between w-full max-w-[600px]">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-zinc-800">Snake</h1>
        <div className="w-32" />
      </div>

      <div className="mb-6 text-center text-zinc-600">
        <p>The snake gets faster as you eat more food!</p>
      </div>

      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />

        {/* HUD */}
        <div className="absolute top-6 left-6 text-white space-y-2">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-xl">High Score: {highScore}</div>
          <div className="text-sm text-zinc-400 mt-4">Length: {gameStateRef.current.snake.length}</div>
        </div>

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Snake</h2>
              <div className="space-y-3 text-xl">
                <p>Use Arrow keys to control the snake</p>
                <p>Eat the red food to grow</p>
                <p>Don&apos;t hit the walls or yourself</p>
              </div>
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-lg transition-colors"
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
              <p className="text-2xl">Length: {gameStateRef.current.snake.length}</p>
              {score === highScore && score > 0 && (
                <p className="text-xl text-yellow-400">New High Score!</p>
              )}
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
