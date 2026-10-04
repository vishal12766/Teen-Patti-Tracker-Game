import { useEffect, useState } from 'react'

export default function Navbar({ onBack, backLabel = 'Reset Game', chip }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    document.addEventListener('msfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
      document.removeEventListener('msfullscreenchange', onChange)
    }
  }, [])

  function toggleFullscreen() {
    const el =
      document.documentElement ||
      document.body ||
      document.querySelector('#root')

    const current =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement

    if (!current) {
      const request =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.webkitRequestFullScreen ||
        el.msRequestFullscreen
      if (request) {
        request.call(el).catch(() => {})
      }
    } else {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.webkitCancelFullScreen ||
        document.msExitFullscreen
      if (exit) {
        exit.call(document).catch(() => {})
      }
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-lg shrink-0 sm:text-xl">🃏</span>
          <span className="hidden bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-base font-extrabold text-transparent sm:text-lg md:inline">
            Teen Patti Tracker
          </span>
          {chip && (
            <span className="truncate rounded-full border border-brand-amber/40 bg-brand-amber/10 px-2.5 py-1 text-[10px] font-bold text-brand-amber sm:px-3 sm:text-xs">
              {chip}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition hover:border-brand-blue/50 hover:bg-brand-blue/10 hover:text-blue-200 active:scale-95 sm:h-9 sm:w-9"
          >
            {isFullscreen ? (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
              </svg>
            )}
          </button>

          <button
            onClick={onBack}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-gray-300 transition hover:border-brand-red/50 hover:bg-brand-red/10 hover:text-red-300 active:scale-95 sm:px-3 sm:py-2 sm:text-sm"
          >
            {backLabel}
          </button>
        </div>
      </div>
    </nav>
  )
}