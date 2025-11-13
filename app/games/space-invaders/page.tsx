'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Position {
  x: number;
  y: number;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Alien extends GameObject {
  type: number;
  alive: boolean;
}

interface Bullet extends Position {
  active: boolean;
}

interface Shield extends GameObject {
  hits: number[][];
}

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    player: { x: 400, y: 550, width: 40, height: 30 } as GameObject,
    aliens: [] as Alien[],
    playerBullets: [] as Bullet[],
    alienBullets: [] as Bullet[],
    shields: [] as Shield[],
    alienDirection: 1,
    alienSpeed: 1,
    alienMoveDownTimer: 0,
    shootTimer: 0,
    keys: {} as Record<string, boolean>,
    invincible: false,
    invincibleTime: 0,
  });

  const createAliens = useCallback((levelNum: number) => {
    const aliens: Alien[] = [];
    const rows = 5;
    const cols = 11;
    const alienWidth = 30;
    const alienHeight = 25;
    const spacing = 15;
    const startX = 100;
    const startY = 60;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type = 0;
        if (row === 0) type = 2;
        else if (row <= 2) type = 1;

        aliens.push({
          x: startX + col * (alienWidth + spacing),
          y: startY + row * (alienHeight + spacing),
          width: alienWidth,
          height: alienHeight,
          type,
          alive: true,
        });
      }
    }

    return aliens;
  }, []);

  const createShields = useCallback(() => {
    const shields: Shield[] = [];
    const shieldWidth = 60;
    const shieldHeight = 40;
    const shieldY = 480;
    const spacing = 150;
    const startX = 150;

    for (let i = 0; i < 4; i++) {
      const hits: number[][] = [];
      for (let y = 0; y < shieldHeight; y += 4) {
        const row: number[] = [];
        for (let x = 0; x < shieldWidth; x += 4) {
          row.push(1);
        }
        hits.push(row);
      }

      shields.push({
        x: startX + i * spacing,
        y: shieldY,
        width: shieldWidth,
        height: shieldHeight,
        hits,
      });
    }

    return shields;
  }, []);

  const checkCollision = useCallback((obj1: GameObject, obj2: GameObject): boolean => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current.player = { x: 400, y: 550, width: 40, height: 30 };
    gameStateRef.current.aliens = createAliens(level);
    gameStateRef.current.playerBullets = [];
    gameStateRef.current.alienBullets = [];
    gameStateRef.current.shields = createShields();
    gameStateRef.current.alienDirection = 1;
    gameStateRef.current.alienSpeed = 1 + (level - 1) * 0.3;
    gameStateRef.current.invincible = true;
    gameStateRef.current.invincibleTime = 120;

    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  }, [level, createAliens, createShields]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);

    gameStateRef.current.player = { x: 400, y: 550, width: 40, height: 30 };
    gameStateRef.current.aliens = createAliens(newLevel);
    gameStateRef.current.playerBullets = [];
    gameStateRef.current.alienBullets = [];
    gameStateRef.current.shields = createShields();
    gameStateRef.current.alienDirection = 1;
    gameStateRef.current.alienSpeed = 1 + (newLevel - 1) * 0.3;
    gameStateRef.current.invincible = true;
    gameStateRef.current.invincibleTime = 120;
  }, [level, createAliens, createShields]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 600;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      gameStateRef.current.keys[e.key] = true;

      if (e.key === ' ' && gameStarted && !gameOver) {
        const { player, playerBullets } = gameStateRef.current;
        if (playerBullets.filter(b => b.active).length < 3) {
          playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            active: true,
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (!gameStarted || gameOver) {
        draw(ctx, canvas);
        return;
      }

      const { player, aliens, playerBullets, alienBullets, shields, keys } = gameStateRef.current;

      // Update invincibility
      if (gameStateRef.current.invincible) {
        gameStateRef.current.invincibleTime--;
        if (gameStateRef.current.invincibleTime <= 0) {
          gameStateRef.current.invincible = false;
        }
      }

      // Player movement
      if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= 5;
      }
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += 5;
      }

      // Update player bullets
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (playerBullets[i].active) {
          playerBullets[i].y -= 8;
          if (playerBullets[i].y < 0) {
            playerBullets[i].active = false;
          }
        }
      }

      // Update alien bullets
      for (let i = alienBullets.length - 1; i >= 0; i--) {
        if (alienBullets[i].active) {
          alienBullets[i].y += 5;
          if (alienBullets[i].y > canvas.height) {
            alienBullets[i].active = false;
          }
        }
      }

      // Move aliens
      gameStateRef.current.alienMoveDownTimer++;
      if (gameStateRef.current.alienMoveDownTimer > 60 / gameStateRef.current.alienSpeed) {
        gameStateRef.current.alienMoveDownTimer = 0;

        let shouldMoveDown = false;
        const aliveAliens = aliens.filter(a => a.alive);

        // Check if any alien hit the edge
        for (const alien of aliveAliens) {
          if (
            (gameStateRef.current.alienDirection > 0 && alien.x + alien.width >= canvas.width - 10) ||
            (gameStateRef.current.alienDirection < 0 && alien.x <= 10)
          ) {
            shouldMoveDown = true;
            gameStateRef.current.alienDirection *= -1;
            break;
          }
        }

        // Move aliens
        for (const alien of aliens) {
          if (alien.alive) {
            alien.x += gameStateRef.current.alienDirection * 10;
            if (shouldMoveDown) {
              alien.y += 15;

              // Check if aliens reached player
              if (alien.y + alien.height >= player.y) {
                setGameOver(true);
                setHighScore(prev => Math.max(prev, score));
              }
            }
          }
        }
      }

      // Aliens shoot randomly
      gameStateRef.current.shootTimer++;
      if (gameStateRef.current.shootTimer > 60) {
        gameStateRef.current.shootTimer = 0;
        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length > 0 && Math.random() < 0.3) {
          const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
          alienBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height,
            active: true,
          });
        }
      }

      // Collision detection - player bullets vs aliens
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (!playerBullets[i].active) continue;

        for (let j = aliens.length - 1; j >= 0; j--) {
          if (!aliens[j].alive) continue;

          const bullet = { x: playerBullets[i].x, y: playerBullets[i].y, width: 4, height: 10 };
          if (checkCollision(bullet, aliens[j])) {
            aliens[j].alive = false;
            playerBullets[i].active = false;

            const points = [30, 20, 10][aliens[j].type];
            setScore(s => s + points);
            break;
          }
        }
      }

      // Collision detection - player bullets vs shields
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (!playerBullets[i].active) continue;

        for (const shield of shields) {
          const bulletX = Math.floor((playerBullets[i].x - shield.x) / 4);
          const bulletY = Math.floor((playerBullets[i].y - shield.y) / 4);

          if (
            bulletX >= 0 &&
            bulletX < shield.hits[0].length &&
            bulletY >= 0 &&
            bulletY < shield.hits.length
          ) {
            if (shield.hits[bulletY][bulletX] === 1) {
              shield.hits[bulletY][bulletX] = 0;
              playerBullets[i].active = false;
              break;
            }
          }
        }
      }

      // Collision detection - alien bullets vs player
      if (!gameStateRef.current.invincible) {
        for (let i = alienBullets.length - 1; i >= 0; i--) {
          if (!alienBullets[i].active) continue;

          const bullet = { x: alienBullets[i].x, y: alienBullets[i].y, width: 4, height: 10 };
          if (checkCollision(bullet, player)) {
            alienBullets[i].active = false;
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setHighScore(prev => Math.max(prev, score));
              } else {
                player.x = 400;
                gameStateRef.current.invincible = true;
                gameStateRef.current.invincibleTime = 120;
              }
              return newLives;
            });
            break;
          }
        }
      }

      // Collision detection - alien bullets vs shields
      for (let i = alienBullets.length - 1; i >= 0; i--) {
        if (!alienBullets[i].active) continue;

        for (const shield of shields) {
          const bulletX = Math.floor((alienBullets[i].x - shield.x) / 4);
          const bulletY = Math.floor((alienBullets[i].y - shield.y) / 4);

          if (
            bulletX >= 0 &&
            bulletX < shield.hits[0].length &&
            bulletY >= 0 &&
            bulletY < shield.hits.length
          ) {
            if (shield.hits[bulletY][bulletX] === 1) {
              shield.hits[bulletY][bulletX] = 0;
              alienBullets[i].active = false;
              break;
            }
          }
        }
      }

      // Check if all aliens are dead
      if (aliens.every(a => !a.alive) && !gameOver) {
        nextLevel();
      }

      draw(ctx, canvas);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const { player, aliens, playerBullets, alienBullets, shields } = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 241.3) % canvas.height;
        const size = (i % 3) === 0 ? 2 : 1;
        ctx.fillRect(x, y, size, size);
      }

      // Draw player
      if (gameStateRef.current.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        // Blink when invincible
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#00cc00';
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
      }

      // Draw aliens
      const alienColors = ['#ff00ff', '#ffff00', '#00ffff'];
      aliens.forEach(alien => {
        if (alien.alive) {
          ctx.fillStyle = alienColors[alien.type];
          ctx.fillRect(alien.x, alien.y, alien.width, alien.height);

          // Simple alien eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(alien.x + 8, alien.y + 8, 5, 5);
          ctx.fillRect(alien.x + alien.width - 13, alien.y + 8, 5, 5);
        }
      });

      // Draw shields
      ctx.fillStyle = '#00ff00';
      shields.forEach(shield => {
        for (let y = 0; y < shield.hits.length; y++) {
          for (let x = 0; x < shield.hits[y].length; x++) {
            if (shield.hits[y][x] === 1) {
              ctx.fillRect(shield.x + x * 4, shield.y + y * 4, 4, 4);
            }
          }
        }
      });

      // Draw player bullets
      ctx.fillStyle = '#ffffff';
      playerBullets.forEach(bullet => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, 4, 10);
        }
      });

      // Draw alien bullets
      ctx.fillStyle = '#ff0000';
      alienBullets.forEach(bullet => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, 4, 10);
        }
      });
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, checkCollision, nextLevel, score, level]);

  return (
    <div className="min-h-screen bg-[#EAE7E0] flex flex-col items-center justify-center p-8">
      <div className="mb-3 flex items-center justify-between w-full max-w-[900px]">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-zinc-800">Space Invaders</h1>
        <div className="w-32" />
      </div>

      <div className="mb-6 text-center text-zinc-600">
        <p>Defend Earth from the alien invasion!</p>
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
              <div key={i} className="w-6 h-4 bg-green-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            ))}
          </div>
          <div className="text-sm text-zinc-400 mt-4">High: {highScore}</div>
        </div>

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Space Invaders</h2>
              <div className="space-y-3 text-xl">
                <p>← → Arrow keys to move</p>
                <p>SPACE to shoot</p>
                <p>Destroy all aliens to advance!</p>
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
