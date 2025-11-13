'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface GameObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

interface Spaceship extends GameObject {
  radius: number;
  thrusting: boolean;
}

interface Bullet extends GameObject {
  radius: number;
  lifespan: number;
}

interface Asteroid extends GameObject {
  radius: number;
  vertices: number;
  offsets: number[];
}

export default function AsteroidGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    ship: null as Spaceship | null,
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    keys: {} as Record<string, boolean>,
    invincible: false,
    invincibleTime: 0,
  });

  const initShip = useCallback((width: number, height: number): Spaceship => {
    return {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: 15,
      thrusting: false,
    };
  }, []);

  const createAsteroid = useCallback((x: number, y: number, radius: number): Asteroid => {
    const vertices = 8 + Math.floor(Math.random() * 5);
    const offsets = Array.from({ length: vertices }, () => 0.5 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 / radius;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: Math.random() * Math.PI * 2,
      radius,
      vertices,
      offsets,
    };
  }, []);

  const initAsteroids = useCallback((width: number, height: number, count: number): Asteroid[] => {
    const asteroids: Asteroid[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (Math.hypot(x - centerX, y - centerY) < 150);

      asteroids.push(createAsteroid(x, y, 50));
    }

    return asteroids;
  }, [createAsteroid]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current.ship = initShip(canvas.width, canvas.height);
    gameStateRef.current.bullets = [];
    gameStateRef.current.asteroids = initAsteroids(canvas.width, canvas.height, 3 + level);
    gameStateRef.current.invincible = true;
    gameStateRef.current.invincibleTime = 180;

    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
    setLevel(1);
  }, [initShip, initAsteroids, level]);

  const nextLevel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newLevel = level + 1;
    setLevel(newLevel);
    gameStateRef.current.ship = initShip(canvas.width, canvas.height);
    gameStateRef.current.bullets = [];
    gameStateRef.current.asteroids = initAsteroids(canvas.width, canvas.height, 3 + newLevel);
    gameStateRef.current.invincible = true;
    gameStateRef.current.invincibleTime = 180;
  }, [level, initShip, initAsteroids]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 800;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = true;

      if (e.key === ' ' && gameStarted && !gameOver) {
        e.preventDefault();
        const ship = gameStateRef.current.ship;
        if (ship && gameStateRef.current.bullets.length < 5) {
          gameStateRef.current.bullets.push({
            x: ship.x + Math.cos(ship.angle) * ship.radius,
            y: ship.y + Math.sin(ship.angle) * ship.radius,
            vx: Math.cos(ship.angle) * 5,
            vy: Math.sin(ship.angle) * 5,
            angle: ship.angle,
            radius: 2,
            lifespan: 60,
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      if (!gameStarted || gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const { ship, bullets, asteroids, keys } = gameStateRef.current;
      if (!ship) return;

      // Update invincibility
      if (gameStateRef.current.invincible) {
        gameStateRef.current.invincibleTime--;
        if (gameStateRef.current.invincibleTime <= 0) {
          gameStateRef.current.invincible = false;
        }
      }

      // Ship controls
      if (keys['ArrowLeft']) {
        ship.angle -= 0.1;
      }
      if (keys['ArrowRight']) {
        ship.angle += 0.1;
      }
      if (keys['ArrowUp']) {
        ship.thrusting = true;
        ship.vx += Math.cos(ship.angle) * 0.15;
        ship.vy += Math.sin(ship.angle) * 0.15;
      } else {
        ship.thrusting = false;
      }

      // Apply friction
      ship.vx *= 0.99;
      ship.vy *= 0.99;

      // Update ship position
      ship.x += ship.vx;
      ship.y += ship.vy;

      // Wrap ship around screen
      if (ship.x < 0) ship.x = canvas.width;
      if (ship.x > canvas.width) ship.x = 0;
      if (ship.y < 0) ship.y = canvas.height;
      if (ship.y > canvas.height) ship.y = 0;

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        bullets[i].lifespan--;

        // Wrap bullets
        if (bullets[i].x < 0) bullets[i].x = canvas.width;
        if (bullets[i].x > canvas.width) bullets[i].x = 0;
        if (bullets[i].y < 0) bullets[i].y = canvas.height;
        if (bullets[i].y > canvas.height) bullets[i].y = 0;

        if (bullets[i].lifespan <= 0) {
          bullets.splice(i, 1);
        }
      }

      // Update asteroids
      asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.angle += 0.01;

        // Wrap asteroids
        if (asteroid.x < -asteroid.radius) asteroid.x = canvas.width + asteroid.radius;
        if (asteroid.x > canvas.width + asteroid.radius) asteroid.x = -asteroid.radius;
        if (asteroid.y < -asteroid.radius) asteroid.y = canvas.height + asteroid.radius;
        if (asteroid.y > canvas.height + asteroid.radius) asteroid.y = -asteroid.radius;
      });

      // Collision detection - bullets vs asteroids
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const dx = bullets[i].x - asteroids[j].x;
          const dy = bullets[i].y - asteroids[j].y;
          const distance = Math.hypot(dx, dy);

          if (distance < asteroids[j].radius) {
            const asteroid = asteroids[j];
            asteroids.splice(j, 1);
            bullets.splice(i, 1);

            // Add score based on asteroid size
            const points = asteroid.radius > 30 ? 20 : asteroid.radius > 15 ? 50 : 100;
            setScore(s => s + points);

            // Break asteroid into smaller pieces
            if (asteroid.radius > 15) {
              const newRadius = asteroid.radius / 2;
              asteroids.push(createAsteroid(asteroid.x, asteroid.y, newRadius));
              asteroids.push(createAsteroid(asteroid.x, asteroid.y, newRadius));
            }

            break;
          }
        }
      }

      // Collision detection - ship vs asteroids
      if (!gameStateRef.current.invincible) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
          const dx = ship.x - asteroids[i].x;
          const dy = ship.y - asteroids[i].y;
          const distance = Math.hypot(dx, dy);

          if (distance < ship.radius + asteroids[i].radius) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameOver(true);
              } else {
                // Respawn ship
                ship.x = canvas.width / 2;
                ship.y = canvas.height / 2;
                ship.vx = 0;
                ship.vy = 0;
                gameStateRef.current.invincible = true;
                gameStateRef.current.invincibleTime = 180;
              }
              return newLives;
            });
            break;
          }
        }
      }

      // Check if level complete
      if (asteroids.length === 0 && !gameOver) {
        nextLevel();
      }

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 241.3) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw ship
      if (gameStateRef.current.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        // Blink when invincible
      } else {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ship.radius, 0);
        ctx.lineTo(-ship.radius, -ship.radius / 2);
        ctx.lineTo(-ship.radius / 2, 0);
        ctx.lineTo(-ship.radius, ship.radius / 2);
        ctx.closePath();
        ctx.stroke();

        // Draw thrust
        if (ship.thrusting) {
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.moveTo(-ship.radius / 2, 0);
          ctx.lineTo(-ship.radius * 1.5, -ship.radius / 3);
          ctx.lineTo(-ship.radius * 1.5, ship.radius / 3);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw bullets
      ctx.fillStyle = '#ffffff';
      bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw asteroids
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.angle);
        ctx.beginPath();
        for (let i = 0; i < asteroid.vertices; i++) {
          const angle = (i / asteroid.vertices) * Math.PI * 2;
          const radius = asteroid.radius * asteroid.offsets[i];
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, nextLevel, createAsteroid]);

  return (
    <div className="min-h-screen bg-[#EAE7E0] flex flex-col items-center justify-center p-8">
      <div className="mb-6 flex items-center justify-between w-full max-w-[1200px]">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-zinc-800">Asteroid</h1>
        <div className="w-32" />
      </div>

      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />

        {/* HUD */}
        <div className="absolute top-6 left-6 text-white space-y-2">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-xl">Level: {level}</div>
          <div className="flex gap-2 items-center">
            <span className="text-xl">Lives:</span>
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-green-500 rounded-full" />
            ))}
          </div>
        </div>

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Asteroid</h2>
              <div className="space-y-3 text-xl">
                <p>← → Arrow keys to rotate</p>
                <p>↑ Arrow key to thrust</p>
                <p>SPACE to shoot</p>
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
              <p className="text-2xl">Level Reached: {level}</p>
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

      <div className="mt-6 text-center text-zinc-600">
        <p>Destroy all asteroids to advance to the next level!</p>
      </div>
    </div>
  );
}
