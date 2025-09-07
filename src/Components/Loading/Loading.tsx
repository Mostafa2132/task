
import { motion } from 'framer-motion';

// FancyLoading.jsx
// A polished, accessible loading component using Tailwind CSS + Framer Motion.
// Default export is a React component you can drop into any app.

export default function Loading({ message = 'Loading', size = 'md' }) {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: { repeat: Infinity, repeatType: 'loop', duration: 0.6 }
    }
  };

  const sizes = {
    sm: { ring: 'w-10 h-10', dots: 'w-2.5 h-2.5', text: 'text-sm' },
    md: { ring: 'w-16 h-16', dots: 'w-3.5 h-3.5', text: 'text-base' },
    lg: { ring: 'w-24 h-24', dots: 'w-4.5 h-4.5', text: 'text-lg' }
  };

  const s = sizes[size] || sizes.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 p-6"
    >
      {/* soft rounded glass with animated gradient blob */}
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className={`absolute -z-10 rounded-2xl blur-3xl opacity-70 bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-400 ${s.ring}`}
          style={{ filter: 'blur(30px)', transform: 'scale(1.18)' }}
        />

        {/* rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 6 }}
          className={`flex items-center justify-center rounded-full bg-white/6 shadow-lg border border-white/6 p-2 ${s.ring}`}
        >
          {/* inner glass */}
          <div className="flex items-center justify-center rounded-full bg-white/4 backdrop-blur-sm p-3">
            {/* three bouncing dots */}
            <div className="flex items-end gap-2">
              <motion.span
                variants={dotVariants}
                animate="animate"
                className={`inline-block rounded-full bg-white/90 ${s.dots}`}
                style={{ display: 'inline-block' }}
              />
              <motion.span
                variants={dotVariants}
                animate="animate"
                transition={{ delay: 0.12, repeat: Infinity }}
                className={`inline-block rounded-full bg-white/85 ${s.dots}`}
                style={{ display: 'inline-block' }}
              />
              <motion.span
                variants={dotVariants}
                animate="animate"
                transition={{ delay: 0.24, repeat: Infinity }}
                className={`inline-block rounded-full bg-white/80 ${s.dots}`}
                style={{ display: 'inline-block' }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* accessible status text with gradient */}
      <div className="flex flex-col items-center gap-1">
        <div className={`font-semibold tracking-wide ${s.text}`}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{message}</span>
          <span className="ml-2 text-sm text-white/50">please wait</span>
        </div>
        <div className="text-xs text-white/40">This may take a moment...</div>
      </div>
    </div>
  );
}
