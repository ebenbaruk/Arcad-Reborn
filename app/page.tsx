'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const games = [
    {
      title: 'Asteroid',
      href: '/games/asteroid',
      description: 'Navigate your spaceship through an asteroid field. Shoot and destroy asteroids while avoiding collisions.',
      icon: '🚀',
      color: 'from-purple-500 to-pink-500',
      featured: true,
    },
    {
      title: 'Snake',
      href: '/games/snake',
      description: 'Classic snake game with a modern twist. Eat food, grow longer, and avoid hitting yourself!',
      icon: '🐍',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Tetris',
      href: '/games/tetris',
      description: 'Stack blocks and clear lines in this timeless puzzle game. The classic that never gets old!',
      icon: '🎮',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Space Invaders',
      href: '/games/space-invaders',
      description: 'Defend Earth from waves of alien invaders. Shoot them down before they reach you!',
      icon: '👾',
      color: 'from-red-500 to-orange-500',
    },
    {
      title: 'Galaga',
      href: '/games/galaga',
      description: 'Battle against diving alien fighters in this arcade classic. Watch out for their attack patterns!',
      icon: '🛸',
      color: 'from-yellow-500 to-amber-500',
    },
    {
      title: 'Gravity Ball',
      href: '/games/gravity-ball',
      description: 'Control gravity to navigate through challenging levels. Change direction to reach the goal!',
      icon: '⚡',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const featuredGame = games.find(g => g.featured);
  const regularGames = games.filter(g => !g.featured);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

      <main className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 py-12 sm:py-16 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center space-y-4 sm:space-y-6 mb-12 sm:mb-20 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-gradient">
            Arcad Reborn
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-purple-200 font-light tracking-wide">
            Classic games reimagined for the modern era
          </p>
          <div className="flex items-center justify-center gap-2 text-purple-300 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>6 games available</span>
          </div>
        </div>

        {/* Featured Game */}
        {featuredGame && (
          <div className={`w-full mb-12 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-purple-300 font-semibold text-sm uppercase tracking-wider">Featured</span>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500 to-transparent" />
            </div>
            <Link
              href={featuredGame.href}
              className="group relative block"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500" />
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
                <div className="relative grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="text-7xl sm:text-8xl transform group-hover:scale-110 transition-transform duration-500">
                      {featuredGame.icon}
                    </div>
                    <div>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
                        {featuredGame.title}
                      </h2>
                      <p className="text-lg sm:text-xl text-purple-200 leading-relaxed">
                        {featuredGame.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-purple-400 font-semibold text-lg group-hover:gap-5 transition-all">
                      <span>Play Now</span>
                      <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-8xl">{featuredGame.icon}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Games Grid */}
        <div className="w-full">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-purple-300 font-semibold text-sm uppercase tracking-wider">All Games</span>
            <div className="h-px flex-1 bg-gradient-to-r from-purple-500 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularGames.map((game, index) => (
              <Link
                key={game.href}
                href={game.href}
                className={`group relative transition-all duration-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${(index + 3) * 100}ms` }}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.color} rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500`} />
                <div className="relative h-full bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16" />
                  <div className="relative space-y-4">
                    <div className="text-5xl sm:text-6xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                        {game.title}
                      </h3>
                      <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400 font-medium group-hover:gap-4 transition-all pt-2">
                      <span className="text-sm">Play Now</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-16 sm:mt-20 text-center text-purple-300/60 text-sm transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>Made with passion for classic gaming</p>
        </div>
      </main>

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
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
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
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
