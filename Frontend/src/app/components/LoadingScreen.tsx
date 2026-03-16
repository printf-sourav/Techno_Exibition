import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-6"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full rounded-full border-4 border-teal-200 border-t-teal-500" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2"
        >
          Medisync
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-500"
        >
          Loading platform...
        </motion.p>
      </div>
    </div>
  );
}
