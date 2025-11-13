'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Collectible {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  points: number;
}

interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

type GravityDirection = 'down' | 'up' | 'left' | 'right';

export default function GravityBallGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    ball: { x: 100, y: 100, vx: 0, vy: 0, radius: 15 } as Ball,
    gravity: 'down' as GravityDirection,
    gravityStrength: 0.5,
    platforms: [] as Platform[],
    collectibles: [] as Collectible[],
    spikes: [] as Spike[],
    goal: { x: 0, y: 0, width: 40, height: 40 },
    levelComplete: false,
    levelCompleteTimer: 0,
    invincible: false,
    invincibleTimer: 0,
  });

  const createLevel = useCallback((levelNum: number) => {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const spikes: Spike[] = [];

    if (levelNum === 1) {
      // Level 1 - Simple introduction
      platforms.push(
        { x: 0, y: 550, width: 900, height: 50 }, // Floor
        { x: 200, y: 450, width: 150, height: 20 },
        { x: 450, y: 350, width: 150, height: 20 },
        { x: 700, y: 250, width: 150, height: 20 },
      );
      collectibles.push(
        { x: 275, y: 420, radius: 10, collected: false, points: 100 },
        { x: 525, y: 320, radius: 10, collected: false, points: 100 },
        { x: 775, y: 220, radius: 10, collected: false, points: 100 },
      );
      spikes.push(
        { x: 400, y: 530, width: 50, height: 20 },
      );
      gameStateRef.current.goal = { x: 800, y: 180, width: 40, height: 40 };
      gameStateRef.current.ball = { x: 100, y: 500, vx: 0, vy: 0, radius: 15 };
    } else if (levelNum === 2) {
      // Level 2 - Vertical challenge
      platforms.push(
        { x: 0, y: 550, width: 200, height: 50 },
        { x: 700, y: 550, width: 200, height: 50 },
        { x: 350, y: 400, width: 200, height: 20 },
        { x: 100, y: 250, width: 200, height: 20 },
        { x: 600, y: 100, width: 200, height: 20 },
      );
      collectibles.push(
        { x: 450, y: 360, radius: 10, collected: false, points: 150 },
        { x: 200, y: 210, radius: 10, collected: false, points: 150 },
        { x: 700, y: 60, radius: 10, collected: false, points: 150 },
      );
      spikes.push(
        { x: 250, y: 530, width: 400, height: 20 },
        { x: 300, y: 380, width: 30, height: 20 },
      );
      gameStateRef.current.goal = { x: 700, y: 30, width: 40, height: 40 };
      gameStateRef.current.ball = { x: 100, y: 500, vx: 0, vy: 0, radius: 15 };
    } else if (levelNum === 3) {
      // Level 3 - Complex gravity switches
      platforms.push(
        { x: 0, y: 550, width: 150, height: 50 },
        { x: 750, y: 550, width: 150, height: 50 },
        { x: 0, y: 0, width: 150, height: 50 },
        { x: 750, y: 0, width: 150, height: 50 },
        { x: 400, y: 300, width: 100, height: 20 },
      );
      collectibles.push(
        { x: 450, y: 260, radius: 10, collected: false, points: 200 },
        { x: 100, y: 300, radius: 10, collected: false, points: 200 },
        { x: 800, y: 300, radius: 10, collected: false, points: 200 },
      );
      spikes.push(
        { x: 200, y: 530, width: 500, height: 20 },
        { x: 200, y: 50, width: 500, height: 20 },
      );
      gameStateRef.current.goal = { x: 800, y: 80, width: 40, height: 40 };
      gameStateRef.current.ball = { x: 75, y: 500, vx: 0, vy: 0, radius: 15 };
    } else {
      // Random level for higher levels
      platforms.push({ x: 0, y: 550, width: 900, height: 50 });
      for (let i = 0; i < 5 + levelNum; i++) {
        platforms.push({
          x: Math.random() * 700,
          y: Math.random() * 450 + 50,
          width: 100 + Math.random() * 100,
          height: 20,
        });
      }
      for (let i = 0; i < 3 + levelNum; i++) {
        collectibles.push({
          x: Math.random() * 850 + 25,
          y: Math.random() * 500 + 25,
          radius: 10,
          collected: false,
          points: 100 + levelNum * 50,
        });
      }
      for (let i = 0; i < 2 + Math.floor(levelNum / 2); i++) {
        spikes.push({
          x: Math.random() * 800,
          y: Math.random() * 500 + 50,
          width: 40 + Math.random() * 40,
          height: 20,
        });
      }
      gameStateRef.current.goal = { x: 800, y: 100, width: 40, height: 40 };
      gameStateRef.current.ball = { x: 100, y: 500, vx: 0, vy: 0, radius: 15 };
    }

    gameStateRef.current.platforms = platforms;
    gameStateRef.current.collectibles = collectibles;
    gameStateRef.current.spikes = spikes;
    gameStateRef.current.gravity = 'down';
  }, []);

  const startGame = useCallback(() => {
    createLevel(1);
    gameStateRef.current.levelComplete = false;
    gameStateRef.current.invincible = false;

    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  }, [createLevel]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    createLevel(newLevel);
    gameStateRef.current.levelComplete = false;
  }, [level, createLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 600;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver) return;

      // Change gravity direction
      if (e.key === 'ArrowUp' || e.key === 'w') {
        gameStateRef.current.gravity = 'up';
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        gameStateRef.current.gravity = 'down';
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameStateRef.current.gravity = 'left';
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        gameStateRef.current.gravity = 'right';
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let animationFrameId: number;

    const gameLoop = () => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (!gameStarted || gameOver) {
        draw(ctx, canvas);
        return;
      }

      const { ball, gravity, gravityStrength, platforms, collectibles, spikes, goal } = gameStateRef.current;

      // Update invincibility
      if (gameStateRef.current.invincible) {
        gameStateRef.current.invincibleTimer--;
        if (gameStateRef.current.invincibleTimer <= 0) {
          gameStateRef.current.invincible = false;
        }
      }

      // Level complete handling
      if (gameStateRef.current.levelComplete) {
        gameStateRef.current.levelCompleteTimer++;
        if (gameStateRef.current.levelCompleteTimer > 90) {
          nextLevel();
          gameStateRef.current.levelCompleteTimer = 0;
        }
        draw(ctx, canvas);
        return;
      }

      // Apply gravity
      switch (gravity) {
        case 'down':
          ball.vy += gravityStrength;
          break;
        case 'up':
          ball.vy -= gravityStrength;
          break;
        case 'left':
          ball.vx -= gravityStrength;
          break;
        case 'right':
          ball.vx += gravityStrength;
          break;
      }

      // Velocity damping
      ball.vx *= 0.99;
      ball.vy *= 0.99;

      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Platform collisions
      platforms.forEach(platform => {
        if (
          ball.x + ball.radius > platform.x &&
          ball.x - ball.radius < platform.x + platform.width &&
          ball.y + ball.radius > platform.y &&
          ball.y - ball.radius < platform.y + platform.height
        ) {
          // Determine collision side
          const overlapLeft = ball.x + ball.radius - platform.x;
          const overlapRight = platform.x + platform.width - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - platform.y;
          const overlapBottom = platform.y + platform.height - (ball.y - ball.radius);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft) {
            ball.x = platform.x - ball.radius;
            ball.vx = -Math.abs(ball.vx) * 0.5;
          } else if (minOverlap === overlapRight) {
            ball.x = platform.x + platform.width + ball.radius;
            ball.vx = Math.abs(ball.vx) * 0.5;
          } else if (minOverlap === overlapTop) {
            ball.y = platform.y - ball.radius;
            ball.vy = -Math.abs(ball.vy) * 0.5;
          } else {
            ball.y = platform.y + platform.height + ball.radius;
            ball.vy = Math.abs(ball.vy) * 0.5;
          }
        }
      });

      // Wall collisions
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.5;
      }
      if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.5;
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * 0.5;
      }
      if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.vy = -Math.abs(ball.vy) * 0.5;
      }

      // Collectible collisions
      collectibles.forEach(collectible => {
        if (!collectible.collected) {
          const dx = ball.x - collectible.x;
          const dy = ball.y - collectible.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ball.radius + collectible.radius) {
            collectible.collected = true;
            setScore(s => s + collectible.points);
          }
        }
      });

      // Spike collisions
      if (!gameStateRef.current.invincible) {
        for (const spike of spikes) {
          if (
            ball.x + ball.radius > spike.x &&
            ball.x - ball.radius < spike.x + spike.width &&
            ball.y + ball.radius > spike.y &&
            ball.y - ball.radius < spike.y + spike.height
          ) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setHighScore(prev => Math.max(prev, score));
              } else {
                createLevel(level);
                gameStateRef.current.invincible = true;
                gameStateRef.current.invincibleTimer = 120;
              }
              return newLives;
            });
            break;
          }
        }
      }

      // Goal collision
      if (
        ball.x + ball.radius > goal.x &&
        ball.x - ball.radius < goal.x + goal.width &&
        ball.y + ball.radius > goal.y &&
        ball.y - ball.radius < goal.y + goal.height
      ) {
        gameStateRef.current.levelComplete = true;
        setScore(s => s + 500);
      }

      draw(ctx, canvas);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const { ball, gravity, platforms, collectibles, spikes, goal } = gameStateRef.current;

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gravity arrows (background indicators)
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#ffffff';
      const arrowSize = 30;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const x = (i + 1) * (canvas.width / 6);
          const y = (j + 1) * (canvas.height / 6);

          ctx.save();
          ctx.translate(x, y);
          if (gravity === 'down') ctx.rotate(Math.PI / 2);
          else if (gravity === 'up') ctx.rotate(-Math.PI / 2);
          else if (gravity === 'left') ctx.rotate(Math.PI);

          ctx.beginPath();
          ctx.moveTo(0, -arrowSize / 2);
          ctx.lineTo(arrowSize / 3, arrowSize / 2);
          ctx.lineTo(-arrowSize / 3, arrowSize / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      // Draw platforms
      ctx.fillStyle = '#444444';
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw spikes
      ctx.fillStyle = '#ff0000';
      spikes.forEach(spike => {
        ctx.beginPath();
        for (let i = 0; i < spike.width; i += 20) {
          ctx.moveTo(spike.x + i, spike.y + spike.height);
          ctx.lineTo(spike.x + i + 10, spike.y);
          ctx.lineTo(spike.x + i + 20, spike.y + spike.height);
        }
        ctx.closePath();
        ctx.fill();
      });

      // Draw collectibles
      collectibles.forEach(collectible => {
        if (!collectible.collected) {
          const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
          ctx.beginPath();
          ctx.arc(collectible.x, collectible.y, collectible.radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = '#ffff00';
          ctx.fill();
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw goal
      const goalPulse = Math.sin(Date.now() / 300) * 0.1 + 0.9;
      ctx.fillStyle = `rgba(0, 255, 0, ${goalPulse})`;
      ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

      // Draw ball
      if (gameStateRef.current.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        // Blink when invincible
      } else {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.strokeStyle = '#00cccc';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ball direction indicator
        ctx.save();
        ctx.translate(ball.x, ball.y);
        if (gravity === 'down') ctx.rotate(Math.PI / 2);
        else if (gravity === 'up') ctx.rotate(-Math.PI / 2);
        else if (gravity === 'left') ctx.rotate(Math.PI);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -ball.radius / 2);
        ctx.lineTo(ball.radius / 3, ball.radius / 2);
        ctx.lineTo(-ball.radius / 3, ball.radius / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Level complete message
      if (gameStateRef.current.levelComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+500 BONUS', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'left';
      }
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, nextLevel, level, createLevel, score]);

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
        <div className="mb-3 flex items-center justify-between w-full max-w-[900px]">
          <Link
            href="/"
            className="text-purple-300 hover:text-purple-100 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Gravity Ball</h1>
          <div className="w-32" />
        </div>

        <div className="mb-6 text-center text-purple-200">
          <p>Control gravity to navigate to the goal!</p>
        </div>

      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />

        {/* HUD */}
        <div className="absolute top-6 left-6 bg-slate-900/50 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2">
          <div className="text-2xl font-bold text-white">Score: {score}</div>
          <div className="text-xl text-purple-200">Level: {level}</div>
          <div className="flex gap-2 items-center">
            <span className="text-xl text-purple-200">Lives:</span>
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-cyan-400 rounded-full" />
            ))}
          </div>
          <div className="text-sm text-purple-300 mt-4">High: {highScore}</div>
        </div>

        {/* Controls display */}
        <div className="absolute top-6 right-6 bg-slate-900/50 backdrop-blur-md rounded-xl p-4 border border-white/10 text-sm">
          <div className="font-bold mb-2 text-white">GRAVITY:</div>
          <div className="text-purple-200">↑/W: Up</div>
          <div className="text-purple-200">↓/S: Down</div>
          <div className="text-purple-200">←/A: Left</div>
          <div className="text-purple-200">→/D: Right</div>
        </div>

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Gravity Ball</h2>
              <div className="space-y-3 text-xl">
                <p>Use Arrow keys or WASD to change gravity direction</p>
                <p>Navigate to the green goal square</p>
                <p>Collect yellow orbs for points</p>
                <p>Avoid red spikes!</p>
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
              <p className="text-2xl">Level Reached: {level}</p>
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
