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

interface Enemy extends GameObject {
  type: number;
  alive: boolean;
  state: 'formation' | 'diving' | 'returning';
  formationX: number;
  formationY: number;
  pathIndex: number;
  angle: number;
}

interface Bullet extends Position {
  active: boolean;
}

export default function GalagaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    player: { x: 400, y: 550, width: 40, height: 30 } as GameObject,
    enemies: [] as Enemy[],
    playerBullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    keys: {} as Record<string, boolean>,
    invincible: false,
    invincibleTime: 0,
    waveComplete: false,
    waveTimer: 0,
    enemiesEntering: true,
    enterTimer: 0,
    diveTimer: 0,
  });

  const createEnemies = useCallback((waveNum: number) => {
    const enemies: Enemy[] = [];
    const rows = 4;
    const cols = 8;
    const enemyWidth = 35;
    const enemyHeight = 30;
    const spacingX = 55;
    const spacingY = 50;
    const startX = 200;
    const startY = 80;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = row === 0 ? 2 : row === 1 ? 1 : 0;
        const formationX = startX + col * spacingX;
        const formationY = startY + row * spacingY;

        enemies.push({
          x: -100,
          y: -100,
          width: enemyWidth,
          height: enemyHeight,
          type,
          alive: true,
          state: 'formation',
          formationX,
          formationY,
          pathIndex: 0,
          angle: 0,
        });
      }
    }

    return enemies;
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current.player = { x: 400, y: 550, width: 40, height: 30 };
    gameStateRef.current.enemies = createEnemies(1);
    gameStateRef.current.playerBullets = [];
    gameStateRef.current.enemyBullets = [];
    gameStateRef.current.invincible = true;
    gameStateRef.current.invincibleTime = 120;
    gameStateRef.current.waveComplete = false;
    gameStateRef.current.enemiesEntering = true;
    gameStateRef.current.enterTimer = 0;

    setScore(0);
    setLives(3);
    setLevel(1);
    setWave(1);
    setGameOver(false);
    setGameStarted(true);
  }, [createEnemies]);

  const nextWave = useCallback(() => {
    const newWave = wave + 1;
    setWave(newWave);

    if (newWave % 3 === 1) {
      setLevel(l => l + 1);
    }

    gameStateRef.current.player = { x: 400, y: 550, width: 40, height: 30 };
    gameStateRef.current.enemies = createEnemies(newWave);
    gameStateRef.current.playerBullets = [];
    gameStateRef.current.enemyBullets = [];
    gameStateRef.current.waveComplete = false;
    gameStateRef.current.enemiesEntering = true;
    gameStateRef.current.enterTimer = 0;
  }, [wave, createEnemies]);

  const checkCollision = useCallback((obj1: GameObject, obj2: GameObject): boolean => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }, []);

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
        if (playerBullets.filter(b => b.active).length < 2) {
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

      const { player, enemies, playerBullets, enemyBullets, keys } = gameStateRef.current;

      // Update invincibility
      if (gameStateRef.current.invincible) {
        gameStateRef.current.invincibleTime--;
        if (gameStateRef.current.invincibleTime <= 0) {
          gameStateRef.current.invincible = false;
        }
      }

      // Player movement
      if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= 6;
      }
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += 6;
      }

      // Enemy entering animation
      if (gameStateRef.current.enemiesEntering) {
        gameStateRef.current.enterTimer++;

        enemies.forEach((enemy, index) => {
          if (gameStateRef.current.enterTimer > index * 3) {
            // Entry path - spiral in
            const progress = Math.min((gameStateRef.current.enterTimer - index * 3) / 60, 1);
            const startX = index % 2 === 0 ? -50 : canvas.width + 50;
            const startY = -50;

            if (progress < 1) {
              const curve = Math.sin(progress * Math.PI);
              enemy.x = startX + (enemy.formationX - startX) * progress;
              enemy.y = startY + (enemy.formationY - startY) * progress + Math.sin(progress * Math.PI * 4) * 50;
              enemy.angle = progress * Math.PI * 4;
            } else {
              enemy.x = enemy.formationX;
              enemy.y = enemy.formationY;
              enemy.state = 'formation';
            }
          }
        });

        // Check if all enemies are in formation
        if (enemies.every(e => e.state === 'formation')) {
          gameStateRef.current.enemiesEntering = false;
        }
      }

      // Enemy AI - diving attacks
      if (!gameStateRef.current.enemiesEntering) {
        gameStateRef.current.diveTimer++;

        // Formation wobble
        const wobble = Math.sin(Date.now() / 500) * 10;
        enemies.forEach(enemy => {
          if (enemy.state === 'formation' && enemy.alive) {
            enemy.x = enemy.formationX + wobble;
          }
        });

        // Random diving
        if (gameStateRef.current.diveTimer > 90) {
          gameStateRef.current.diveTimer = 0;
          const formationEnemies = enemies.filter(e => e.alive && e.state === 'formation');
          if (formationEnemies.length > 0 && Math.random() < 0.3) {
            const diver = formationEnemies[Math.floor(Math.random() * formationEnemies.length)];
            diver.state = 'diving';
            diver.pathIndex = 0;
          }
        }

        // Update diving enemies
        enemies.forEach(enemy => {
          if (!enemy.alive) return;

          if (enemy.state === 'diving') {
            enemy.pathIndex++;
            const progress = enemy.pathIndex / 120;

            if (progress < 0.5) {
              // Dive down in a curve
              const curve = Math.sin(progress * Math.PI * 2);
              enemy.x += (player.x - enemy.x) * 0.02 + Math.cos(progress * Math.PI * 6) * 5;
              enemy.y += 5;
              enemy.angle = Math.atan2(5, (player.x - enemy.x) * 0.02);
            } else {
              // Return to formation
              enemy.state = 'returning';
              enemy.pathIndex = 0;
            }

            // Shoot while diving
            if (enemy.pathIndex % 20 === 0 && Math.random() < 0.4) {
              enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 2,
                y: enemy.y + enemy.height,
                active: true,
              });
            }

            // Check if went off screen
            if (enemy.y > canvas.height + 50) {
              enemy.state = 'returning';
              enemy.pathIndex = 0;
            }
          } else if (enemy.state === 'returning') {
            enemy.pathIndex++;
            const progress = Math.min(enemy.pathIndex / 80, 1);

            enemy.x += (enemy.formationX - enemy.x) * 0.05;
            enemy.y += (enemy.formationY - enemy.y) * 0.05;
            enemy.angle = Math.atan2(enemy.formationY - enemy.y, enemy.formationX - enemy.x);

            if (progress >= 1) {
              enemy.state = 'formation';
              enemy.x = enemy.formationX;
              enemy.y = enemy.formationY;
            }
          }
        });
      }

      // Update player bullets
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (playerBullets[i].active) {
          playerBullets[i].y -= 10;
          if (playerBullets[i].y < 0) {
            playerBullets[i].active = false;
          }
        }
      }

      // Update enemy bullets
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i].active) {
          enemyBullets[i].y += 6;
          if (enemyBullets[i].y > canvas.height) {
            enemyBullets[i].active = false;
          }
        }
      }

      // Collision detection - player bullets vs enemies
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (!playerBullets[i].active) continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
          if (!enemies[j].alive) continue;

          const bullet = { x: playerBullets[i].x, y: playerBullets[i].y, width: 4, height: 10 };
          if (checkCollision(bullet, enemies[j])) {
            enemies[j].alive = false;
            playerBullets[i].active = false;

            const points = [100, 200, 400][enemies[j].type];
            setScore(s => s + points);
            break;
          }
        }
      }

      // Collision detection - enemy bullets vs player
      if (!gameStateRef.current.invincible) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          if (!enemyBullets[i].active) continue;

          const bullet = { x: enemyBullets[i].x, y: enemyBullets[i].y, width: 4, height: 10 };
          if (checkCollision(bullet, player)) {
            enemyBullets[i].active = false;
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

      // Collision detection - diving enemies vs player
      if (!gameStateRef.current.invincible) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (enemy.state === 'diving' && checkCollision(enemy, player)) {
            enemy.alive = false;
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

      // Check if wave is complete
      if (enemies.every(e => !e.alive) && !gameOver && !gameStateRef.current.waveComplete) {
        gameStateRef.current.waveComplete = true;
        gameStateRef.current.waveTimer = 120;
      }

      if (gameStateRef.current.waveComplete) {
        gameStateRef.current.waveTimer--;
        if (gameStateRef.current.waveTimer <= 0) {
          nextWave();
        }
      }

      draw(ctx, canvas);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const { player, enemies, playerBullets, enemyBullets } = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 150; i++) {
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
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height - 10);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(player.x, player.y + 15, 10, 10);
        ctx.fillRect(player.x + player.width - 10, player.y + 15, 10, 10);
      }

      // Draw enemies
      const enemyColors = ['#4169E1', '#FFD700', '#FF1493'];
      enemies.forEach(enemy => {
        if (enemy.alive) {
          ctx.save();
          ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          if (enemy.state !== 'formation') {
            ctx.rotate(enemy.angle);
          }
          ctx.translate(-(enemy.x + enemy.width / 2), -(enemy.y + enemy.height / 2));

          ctx.fillStyle = enemyColors[enemy.type];

          // Body
          ctx.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, enemy.height);

          // Wings
          ctx.fillRect(enemy.x, enemy.y + 10, enemy.width, enemy.height - 15);

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(enemy.x + 10, enemy.y + 8, 6, 6);
          ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + 8, 6, 6);

          ctx.restore();
        }
      });

      // Draw player bullets
      ctx.fillStyle = '#ffffff';
      playerBullets.forEach(bullet => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, 4, 12);
        }
      });

      // Draw enemy bullets
      ctx.fillStyle = '#ff0000';
      enemyBullets.forEach(bullet => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, 4, 12);
        }
      });

      // Draw wave complete message
      if (gameStateRef.current.waveComplete) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WAVE COMPLETE!', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
      }
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, checkCollision, nextWave, score]);

  return (
    <div className="min-h-screen bg-[#EAE7E0] flex flex-col items-center justify-center p-8">
      <div className="mb-3 flex items-center justify-between w-full max-w-[900px]">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-zinc-800">Galaga</h1>
        <div className="w-32" />
      </div>

      <div className="mb-6 text-center text-zinc-600">
        <p>Fight off waves of alien attackers!</p>
      </div>

      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />

        {/* HUD */}
        <div className="absolute top-6 left-6 text-white space-y-2">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-xl">Wave: {wave}</div>
          <div className="text-xl">Level: {level}</div>
          <div className="flex gap-2 items-center">
            <span className="text-xl">Lives:</span>
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className="w-6 h-4 bg-green-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 50% 75%, 100% 100%)' }} />
            ))}
          </div>
          <div className="text-sm text-zinc-400 mt-4">High: {highScore}</div>
        </div>

        {/* Instructions overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white space-y-6 p-8">
              <h2 className="text-5xl font-bold mb-8">Galaga</h2>
              <div className="space-y-3 text-xl">
                <p>← → Arrow keys to move</p>
                <p>SPACE to shoot</p>
                <p>Watch out for diving enemies!</p>
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
              <p className="text-2xl">Wave Reached: {wave}</p>
              <p className="text-2xl">Level: {level}</p>
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
