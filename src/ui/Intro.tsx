import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

const ease = [0.22, 1, 0.36, 1] as const

/** The opening title. It yields to the tree as the lineage draws itself. */
export function Intro({ active, onSkip }: { active: boolean; onSkip: () => void }) {
  const [title, setTitle] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setTitle(false), 3400)
    return () => clearTimeout(t)
  }, [])
  const show = active && title

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 1.1, ease } }}
          onClick={onSkip}
        >
          <motion.div
            className="intro-dv"
            initial={{ opacity: 0, y: 8, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.32em' }}
            transition={{ duration: 1.6, ease, delay: 0.15 }}
          >
            द्वापर युग
          </motion.div>
          <h1 className="intro-title">
            {'Dvapara Yuga'.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease, delay: 0.35 + i * 0.045 }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="intro-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 1.2 }}
          >
            Every bloodline of the Mahabharata — from the Creator to the last king.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
