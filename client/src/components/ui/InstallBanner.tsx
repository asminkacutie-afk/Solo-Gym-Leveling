import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share, MoreVertical } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

export default function InstallBanner() {
  const { state, triggerInstall, dismiss } = useInstallPrompt()
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  const visible = state === 'prompt-native' || state === 'prompt-ios'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="install-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div
            className="mx-auto max-w-md rounded-2xl border border-purple-500/30 bg-[#12071e] p-4"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.25), 0 8px 32px rgba(0,0,0,0.7)' }}
          >
            {/* Header row */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-purple-500/40">
                <img src="/icons/icon-192.svg" alt="GymRPG" className="w-full h-full" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-white text-sm leading-tight">
                  Add GymRPG to Home Screen
                </p>
                <p className="text-gray-400 text-xs mt-0.5 leading-snug">
                  {state === 'prompt-ios'
                    ? 'Install for a full-screen app experience — works offline'
                    : 'Install for instant access and offline workout logging'}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Native install button */}
            {state === 'prompt-native' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={triggerInstall}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-purple-600 hover:bg-purple-500 text-white font-display font-semibold text-sm
                    transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
                >
                  <Download size={15} />
                  Install App
                </button>
                <button
                  onClick={dismiss}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400
                    hover:text-gray-200 hover:bg-white/5 font-semibold text-sm transition-colors"
                >
                  Not now
                </button>
              </div>
            )}

            {/* iOS instructions */}
            {state === 'prompt-ios' && (
              <div className="mt-3 space-y-2">
                {!showIOSSteps ? (
                  <button
                    onClick={() => setShowIOSSteps(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40
                      text-purple-300 font-display font-semibold text-sm transition-all"
                  >
                    <Share size={15} />
                    Show me how
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
                      Safari install steps
                    </p>
                    {[
                      { icon: <Share size={14} className="text-[#38bdf8]" />, text: 'Tap the Share button in Safari\'s toolbar' },
                      { icon: <MoreVertical size={14} className="text-[#f59e0b]" />, text: 'Scroll down and tap "Add to Home Screen"' },
                      { icon: <Download size={14} className="text-purple-400" />, text: 'Tap "Add" in the top right to confirm' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step.icon}
                        </span>
                        <p className="text-xs text-gray-300 leading-snug">{step.text}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
                <button
                  onClick={dismiss}
                  className="w-full text-center text-xs text-gray-600 hover:text-gray-500 py-1 transition-colors"
                >
                  Don't show again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
