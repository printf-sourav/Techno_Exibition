import { motion } from 'motion/react';
import { Pill } from 'lucide-react';

export function FloatingCapsules() {
  const capsules = [
    { delay: 0, duration: 35, x: '5%', startY: '100%' },
    { delay: 8, duration: 40, x: '25%', startY: '100%' },
    { delay: 16, duration: 38, x: '50%', startY: '100%' },
    { delay: 24, duration: 42, x: '75%', startY: '100%' },
    { delay: 32, duration: 36, x: '95%', startY: '100%' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {capsules.map((capsule, index) => (
        <motion.div
          key={index}
          initial={{
            x: capsule.x,
            y: capsule.startY,
            opacity: 0,
          }}
          animate={{
            y: [capsule.startY, '-20%'],
            opacity: [0, 0.06, 0.06, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            delay: capsule.delay,
            duration: capsule.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute"
        >
          <Pill className="w-6 h-6 text-teal-400/60" />
        </motion.div>
      ))}
    </div>
  );
}