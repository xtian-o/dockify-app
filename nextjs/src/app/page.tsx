export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-6xl font-bold mb-8">🚀 Dockify App</h1>

        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-700 inline-block">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 w-32 text-right">Version:</span>
              <span className="text-cyan-400 font-mono text-xl">
                {process.env.GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 w-32 text-right">Image Tag:</span>
              <span className="text-yellow-400 font-mono text-xl">
                main-{process.env.GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <a
              href="/info"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-block font-semibold"
            >
              View System Info →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
