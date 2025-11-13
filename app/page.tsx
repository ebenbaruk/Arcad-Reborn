import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAE7E0]">
      <main className="flex flex-col items-center justify-center px-8 py-16 w-full max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-zinc-800">
            Arcad Reborn
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 font-light tracking-wide">
            Our favorite old school games
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {/* Asteroid Game Card */}
          <Link
            href="/games/asteroid"
            className="group relative bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
          >
            <h2 className="text-4xl font-bold text-white mb-3">Asteroid</h2>
            <p className="text-zinc-300 text-lg">
              Navigate your spaceship through an asteroid field. Shoot and destroy asteroids while avoiding collisions.
            </p>
            <div className="mt-6 flex items-center text-green-400 font-medium">
              <span>Play Now</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Snake Game Card */}
          <Link
            href="/games/snake"
            className="group relative bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
          >
            <h2 className="text-4xl font-bold text-white mb-3">Snake</h2>
            <p className="text-zinc-300 text-lg">
              Classic snake game with a modern twist. Eat food, grow longer, and avoid hitting yourself!
            </p>
            <div className="mt-6 flex items-center text-green-400 font-medium">
              <span>Play Now</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <div className="relative bg-zinc-700/50 rounded-2xl p-8 shadow-xl">
            <div className="opacity-50">
              <h2 className="text-4xl font-bold text-white mb-3">Tetris</h2>
              <p className="text-zinc-300 text-lg">
                Stack blocks and clear lines in this timeless puzzle game.
              </p>
              <div className="mt-6 text-zinc-400 font-medium">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
