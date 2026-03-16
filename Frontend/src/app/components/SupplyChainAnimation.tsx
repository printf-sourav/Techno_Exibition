import { motion } from 'motion/react';
import { Store, Building2, Heart, Trash2 } from 'lucide-react';

export function SupplyChainAnimation() {
  const nodes = [
    { icon: Store, label: 'Pharmacy', x: '10%', y: '50%', color: 'from-teal-500 to-cyan-500' },
    { icon: Building2, label: 'Hospital', x: '35%', y: '50%', color: 'from-blue-500 to-indigo-500' },
    { icon: Heart, label: 'NGO', x: '60%', y: '50%', color: 'from-purple-500 to-pink-500' },
    { icon: Trash2, label: 'Waste', x: '85%', y: '50%', color: 'from-gray-600 to-slate-600' },
  ];

  return (
    <div className="relative w-full h-32 my-12">
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {[0, 1, 2].map((i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 25 + 5}%`}
            y1="50%"
            x2={`${35 + i * 25 - 5}%`}
            y2="50%"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 1.5, delay: i * 0.3 }}
            viewport={{ once: true }}
          />
        ))}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated Particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-teal-500 rounded-full"
          style={{ top: '50%', left: `${10 + i * 25 + 5}%` }}
          animate={{
            left: [`${10 + i * 25 + 5}%`, `${35 + i * 25 - 5}%`],
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'linear',
          }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, index) => (
        <motion.div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: node.x, top: node.y }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
          viewport={{ once: true }}
        >
          <div className={`w-16 h-16 bg-gradient-to-br ${node.color} rounded-2xl flex items-center justify-center shadow-lg mb-2`}>
            <node.icon className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs text-center text-gray-600 font-medium">{node.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
