import { motion } from 'motion/react';
import { Activity, Pill, Package2, Heart, Zap } from 'lucide-react';

const FloatingIcon = ({ 
  icon: Icon, 
  delay, 
  x, 
  y, 
  duration 
}: { 
  icon: any; 
  delay: number; 
  x: number; 
  y: number; 
  duration: number;
}) => {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        y: [0, -20, -40, -60],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-3 rounded-xl shadow-lg backdrop-blur-sm bg-opacity-20">
        <Icon className="w-6 h-6 text-teal-600" />
      </div>
    </motion.div>
  );
};

const NetworkNode = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  return (
    <motion.div
      className="absolute w-3 h-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1, 1.2, 1],
        opacity: [0, 1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 3,
      }}
    >
      <motion.div
        className="absolute inset-0 bg-teal-400 rounded-full"
        animate={{
          scale: [1, 2, 2.5],
          opacity: [0.6, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </motion.div>
  );
};

const ConnectionLine = ({ 
  x1, 
  y1, 
  x2, 
  y2, 
  delay 
}: { 
  x1: number; 
  y1: number; 
  x2: number; 
  y2: number; 
  delay: number;
}) => {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <motion.line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke="url(#gradient)"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: [0, 1, 1, 0],
          opacity: [0, 0.6, 0.6, 0],
        }}
        transition={{
          duration: 3,
          delay: delay,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

const Capsule = ({ x, y, delay, rotation }: { x: number; y: number; delay: number; rotation: number }) => {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        rotate: [0, rotation, rotation + 180, rotation + 360],
        x: [0, 20, -10, 0],
        y: [0, -30, -50, -70],
      }}
      transition={{
        duration: 5,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 1,
      }}
    >
      <div className="flex gap-0.5">
        <div className="w-6 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-l-full" />
        <div className="w-6 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-r-full" />
      </div>
    </motion.div>
  );
};

const MedicineBox = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0],
        rotate: [0, 90, 180, 270],
        y: [0, -40, -80, -120],
      }}
      transition={{
        duration: 6,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-lg shadow-lg flex items-center justify-center">
        <div className="w-6 h-1 bg-white rounded-full" />
      </div>
    </motion.div>
  );
};

export function AnimatedHero() {
  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Central Wireframe Sphere */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-80 h-80">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 border-2 border-teal-500/30 rounded-full"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          {/* Middle ring */}
          <motion.div
            className="absolute inset-8 border-2 border-cyan-500/30 rounded-full"
            animate={{ scale: [1, 0.9, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Inner ring */}
          <motion.div
            className="absolute inset-16 border-2 border-teal-500/40 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          
          {/* Core */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full shadow-2xl shadow-teal-500/50" />
          </motion.div>
        </div>
      </motion.div>

      {/* Network Nodes */}
      <NetworkNode x={20} y={30} delay={0} />
      <NetworkNode x={80} y={25} delay={0.5} />
      <NetworkNode x={30} y={70} delay={1} />
      <NetworkNode x={70} y={65} delay={1.5} />
      <NetworkNode x={50} y={85} delay={2} />
      <NetworkNode x={15} y={55} delay={2.5} />
      <NetworkNode x={85} y={50} delay={3} />

      {/* Connection Lines */}
      <ConnectionLine x1={20} y1={30} x2={50} y2={50} delay={0} />
      <ConnectionLine x1={80} y1={25} x2={50} y2={50} delay={0.5} />
      <ConnectionLine x1={30} y1={70} x2={50} y2={50} delay={1} />
      <ConnectionLine x1={70} y1={65} x2={50} y2={50} delay={1.5} />

      {/* Floating Icons */}
      <FloatingIcon icon={Pill} delay={0} x={15} y={20} duration={4} />
      <FloatingIcon icon={Activity} delay={0.5} x={75} y={15} duration={5} />
      <FloatingIcon icon={Package2} delay={1} x={25} y={60} duration={4.5} />
      <FloatingIcon icon={Heart} delay={1.5} x={65} y={55} duration={5.5} />
      <FloatingIcon icon={Zap} delay={2} x={85} y={40} duration={4} />

      {/* Capsules */}
      <Capsule x={10} y={80} delay={0} rotation={45} />
      <Capsule x={40} y={85} delay={1} rotation={-30} />
      <Capsule x={70} y={82} delay={2} rotation={60} />
      <Capsule x={88} y={75} delay={1.5} rotation={-45} />

      {/* Medicine Boxes */}
      <MedicineBox x={25} y={88} delay={0.5} />
      <MedicineBox x={55} y={90} delay={1.5} />
      <MedicineBox x={82} y={85} delay={2.5} />

      {/* Ambient Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/60 rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 5,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-teal-500/5 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
