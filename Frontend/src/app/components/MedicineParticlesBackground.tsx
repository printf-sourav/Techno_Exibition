import { motion } from 'motion/react';

// Floating capsule particle using CSS
function CapsuleParticle({ 
  delay, 
  x, 
  y, 
  duration 
}: { 
  delay: number; 
  x: string; 
  y: string; 
  duration: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -50, 0],
        x: [0, Math.random() > 0.5 ? 20 : -20, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute"
      style={{ left: x, top: y }}
    >
      {/* Capsule shape made with CSS */}
      <div className="relative w-12 h-6">
        {/* Capsule body */}
        <div className="absolute inset-0 flex">
          {/* Left half - colored */}
          <div className="w-1/2 h-full bg-gradient-to-r from-teal-400 to-teal-500 opacity-20 rounded-l-full" />
          {/* Right half - white */}
          <div className="w-1/2 h-full bg-gradient-to-r from-gray-100 to-gray-200 opacity-20 rounded-r-full" />
        </div>
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 opacity-30" />
      </div>
    </motion.div>
  );
}

// Circular pill particle
function PillParticle({ 
  delay, 
  x, 
  y, 
  duration 
}: { 
  delay: number; 
  x: string; 
  y: string; 
  duration: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -40, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute"
      style={{ left: x, top: y }}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 opacity-20 rounded-full" />
    </motion.div>
  );
}

// Medicine box particle
function BoxParticle({ 
  delay, 
  x, 
  y, 
  duration 
}: { 
  delay: number; 
  x: string; 
  y: string; 
  duration: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -35, 0],
        rotate: [0, 15, -15, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute"
      style={{ left: x, top: y }}
    >
      <div className="w-10 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-15 rounded-lg" />
    </motion.div>
  );
}

export function MedicineParticlesBackground() {
  // Generate random positions for particles
  const particles = [
    { type: 'capsule', x: '10%', y: '20%', delay: 0, duration: 8 },
    { type: 'pill', x: '20%', y: '60%', delay: 0.5, duration: 7 },
    { type: 'box', x: '15%', y: '80%', delay: 1, duration: 9 },
    { type: 'capsule', x: '30%', y: '40%', delay: 1.5, duration: 7.5 },
    { type: 'pill', x: '40%', y: '70%', delay: 2, duration: 8.5 },
    { type: 'box', x: '50%', y: '30%', delay: 0.3, duration: 8 },
    { type: 'capsule', x: '60%', y: '50%', delay: 0.8, duration: 7 },
    { type: 'pill', x: '70%', y: '25%', delay: 1.2, duration: 9 },
    { type: 'box', x: '80%', y: '65%', delay: 1.8, duration: 7.5 },
    { type: 'capsule', x: '85%', y: '45%', delay: 2.2, duration: 8 },
    { type: 'pill', x: '75%', y: '85%', delay: 0.6, duration: 8.5 },
    { type: 'box', x: '25%', y: '15%', delay: 1.4, duration: 7.8 },
    { type: 'capsule', x: '90%', y: '75%', delay: 1.9, duration: 8.2 },
    { type: 'pill', x: '5%', y: '50%', delay: 0.4, duration: 7.3 },
    { type: 'box', x: '95%', y: '20%', delay: 2.5, duration: 8.7 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => {
        if (particle.type === 'capsule') {
          return (
            <CapsuleParticle
              key={i}
              delay={particle.delay}
              x={particle.x}
              y={particle.y}
              duration={particle.duration}
            />
          );
        } else if (particle.type === 'pill') {
          return (
            <PillParticle
              key={i}
              delay={particle.delay}
              x={particle.x}
              y={particle.y}
              duration={particle.duration}
            />
          );
        } else {
          return (
            <BoxParticle
              key={i}
              delay={particle.delay}
              x={particle.x}
              y={particle.y}
              duration={particle.duration}
            />
          );
        }
      })}
    </div>
  );
}
