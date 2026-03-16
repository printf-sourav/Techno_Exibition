import { motion } from 'motion/react';
import { Store, Building2, Heart, Trash2 } from 'lucide-react';

// Animated node in the supply chain
function ChainNode({ 
  position, 
  color, 
  icon: Icon,
  label,
  delay = 0
}: { 
  position: { x: string; y: string };
  color: string;
  icon: any;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, type: 'spring' }}
      className="absolute"
      style={{ left: position.x, top: position.y }}
    >
      {/* Pulsing outer ring */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
        className={`absolute inset-0 ${color} rounded-full blur-xl`}
        style={{ width: '120px', height: '120px', marginLeft: '-10px', marginTop: '-10px' }}
      />
      
      {/* Main node */}
      <div className={`relative w-24 h-24 ${color} rounded-full flex items-center justify-center shadow-2xl`}>
        <Icon className="w-12 h-12 text-white" />
      </div>
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
      </div>
    </motion.div>
  );
}

// Animated connection line with flowing particles
function ConnectionLine({ 
  start, 
  end, 
  color,
  delay = 0
}: { 
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  delay?: number;
}) {
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

  return (
    <div
      className="absolute"
      style={{
        left: `${start.x}px`,
        top: `${start.y}px`,
        width: `${length}px`,
        height: '4px',
        transformOrigin: '0 0',
        transform: `rotate(${angle}deg)`,
      }}
    >
      {/* Base line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay }}
        className={`absolute inset-0 ${color} rounded-full opacity-30`}
        style={{ transformOrigin: '0 0' }}
      />
      
      {/* Flowing particle */}
      <motion.div
        animate={{ x: [0, length, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay }}
        className={`absolute w-3 h-3 ${color} rounded-full shadow-lg`}
        style={{ top: '-4px' }}
      />
    </div>
  );
}

export function SupplyChainThree() {
  // Node positions (centered layout) - responsive
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const centerX = isMobile ? 200 : 250;
  const centerY = isMobile ? 200 : 150;
  const radius = isMobile ? 80 : 120;
  const offset = isMobile ? 60 : 100;

  const retailerPos = { x: centerX - radius - offset, y: centerY };
  const hospitalPos = { x: centerX, y: centerY - radius };
  const ngoPos = { x: centerX, y: centerY + radius };
  const wastePos = { x: centerX + radius + offset, y: centerY };

  return (
    <div className="w-full h-[400px] md:h-[400px] relative bg-gradient-to-br from-teal-50/50 to-cyan-50/50 rounded-3xl overflow-hidden">
      {/* Background gradient effects */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"
      />

      {/* Connection lines */}
      <div className="absolute inset-0">
        <ConnectionLine 
          start={{ x: retailerPos.x + 48, y: retailerPos.y + 48 }} 
          end={{ x: hospitalPos.x + 48, y: hospitalPos.y + 48 }} 
          color="bg-teal-500"
          delay={0.2}
        />
        <ConnectionLine 
          start={{ x: retailerPos.x + 48, y: retailerPos.y + 48 }} 
          end={{ x: ngoPos.x + 48, y: ngoPos.y + 48 }} 
          color="bg-teal-500"
          delay={0.4}
        />
        <ConnectionLine 
          start={{ x: hospitalPos.x + 48, y: hospitalPos.y + 48 }} 
          end={{ x: wastePos.x + 48, y: wastePos.y + 48 }} 
          color="bg-blue-500"
          delay={0.6}
        />
        <ConnectionLine 
          start={{ x: ngoPos.x + 48, y: ngoPos.y + 48 }} 
          end={{ x: wastePos.x + 48, y: wastePos.y + 48 }} 
          color="bg-purple-500"
          delay={0.8}
        />
      </div>

      {/* Nodes */}
      <ChainNode 
        position={{ x: `${retailerPos.x}px`, y: `${retailerPos.y}px` }} 
        color="bg-gradient-to-br from-teal-500 to-cyan-500" 
        icon={Store}
        label="Retailer"
        delay={0}
      />
      <ChainNode 
        position={{ x: `${hospitalPos.x}px`, y: `${hospitalPos.y}px` }} 
        color="bg-gradient-to-br from-blue-500 to-indigo-500" 
        icon={Building2}
        label="Hospital"
        delay={0.1}
      />
      <ChainNode 
        position={{ x: `${ngoPos.x}px`, y: `${ngoPos.y}px` }} 
        color="bg-gradient-to-br from-purple-500 to-pink-500" 
        icon={Heart}
        label="NGO"
        delay={0.2}
      />
      <ChainNode 
        position={{ x: `${wastePos.x}px`, y: `${wastePos.y}px` }} 
        color="bg-gradient-to-br from-gray-600 to-slate-600" 
        icon={Trash2}
        label="Waste Agency"
        delay={0.3}
      />
    </div>
  );
}