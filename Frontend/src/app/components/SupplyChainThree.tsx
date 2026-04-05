import { motion } from 'motion/react';
import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { Store, Building2, Heart, Trash2 } from 'lucide-react';

type NodeSpec = {
  id: 'retailer' | 'hospital' | 'ngo' | 'waste';
  x: number;
  y: number;
  label: string;
  gradient: string;
  glow: string;
  icon: ComponentType<{ className?: string }>;
};

type EdgeSpec = {
  from: NodeSpec['id'];
  to: NodeSpec['id'];
  stroke: string;
  particle: string;
  delay: number;
};

function ChainNode({
  node,
  delay,
}: {
  node: NodeSpec;
  delay: number;
}) {
  const Icon = node.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, type: 'spring' }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      {/* Pulsing outer ring */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, delay }}
        className={`absolute inset-0 ${node.glow} rounded-full blur-xl`}
        style={{ width: '118px', height: '118px', marginLeft: '-11px', marginTop: '-11px' }}
      />
      
      {/* Main node */}
      <div
        className={`relative w-20 h-20 md:w-24 md:h-24 ${node.gradient} rounded-full flex items-center justify-center border border-white/55`}
        style={{
          boxShadow:
            '12px 12px 24px rgba(47,72,88,0.2), -6px -6px 14px rgba(255,255,255,0.45), inset 1px 1px 0 rgba(255,255,255,0.58), inset -2px -2px 7px rgba(0,0,0,0.12)',
        }}
      >
        <Icon className="w-10 h-10 md:w-11 md:h-11 text-white" />
      </div>
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <p className="text-sm font-semibold text-[#2F4858]">{node.label}</p>
      </div>
    </motion.div>
  );
}

export function SupplyChainThree() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  const nodes = useMemo<NodeSpec[]>(
    () =>
      isMobile
        ? [
            {
              id: 'retailer',
              x: 18,
              y: 50,
              label: 'Retailer',
              gradient: 'bg-gradient-to-br from-[#2EFCDC] to-[#00D6D0]',
              glow: 'bg-[#2EFCDC]/55',
              icon: Store,
            },
            {
              id: 'hospital',
              x: 50,
              y: 23,
              label: 'Hospital',
              gradient: 'bg-gradient-to-br from-[#00D6D0] to-[#00B0BC]',
              glow: 'bg-[#00D6D0]/50',
              icon: Building2,
            },
            {
              id: 'ngo',
              x: 50,
              y: 77,
              label: 'NGO',
              gradient: 'bg-gradient-to-br from-[#00B0BC] to-[#188CA0]',
              glow: 'bg-[#00B0BC]/48',
              icon: Heart,
            },
            {
              id: 'waste',
              x: 82,
              y: 50,
              label: 'Waste Agency',
              gradient: 'bg-gradient-to-br from-[#2D697E] to-[#2F4858]',
              glow: 'bg-[#2D697E]/50',
              icon: Trash2,
            },
          ]
        : [
            {
              id: 'retailer',
              x: 18,
              y: 50,
              label: 'Retailer',
              gradient: 'bg-gradient-to-br from-[#2EFCDC] to-[#00D6D0]',
              glow: 'bg-[#2EFCDC]/55',
              icon: Store,
            },
            {
              id: 'hospital',
              x: 50,
              y: 24,
              label: 'Hospital',
              gradient: 'bg-gradient-to-br from-[#00D6D0] to-[#00B0BC]',
              glow: 'bg-[#00D6D0]/50',
              icon: Building2,
            },
            {
              id: 'ngo',
              x: 50,
              y: 76,
              label: 'NGO',
              gradient: 'bg-gradient-to-br from-[#00B0BC] to-[#188CA0]',
              glow: 'bg-[#00B0BC]/48',
              icon: Heart,
            },
            {
              id: 'waste',
              x: 82,
              y: 50,
              label: 'Waste Agency',
              gradient: 'bg-gradient-to-br from-[#2D697E] to-[#2F4858]',
              glow: 'bg-[#2D697E]/50',
              icon: Trash2,
            },
          ],
    [isMobile]
  );

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<NodeSpec['id'], NodeSpec>,
    [nodes]
  );

  const edges: EdgeSpec[] = [
    { from: 'retailer', to: 'hospital', stroke: '#2ECFD2', particle: '#2EFCDC', delay: 0.2 },
    { from: 'retailer', to: 'ngo', stroke: '#25BFD0', particle: '#00D6D0', delay: 0.35 },
    { from: 'hospital', to: 'waste', stroke: '#1899AF', particle: '#00B0BC', delay: 0.5 },
    { from: 'ngo', to: 'waste', stroke: '#2D697E', particle: '#188CA0', delay: 0.65 },
  ];

  return (
    <div
      className="w-full h-[400px] md:h-[420px] relative bg-gradient-to-br from-[#F2FAFB]/85 via-[#E6F2F5]/90 to-[#DCE8EE]/88 rounded-3xl overflow-hidden border border-white/65"
      style={{
        boxShadow:
          '20px 20px 44px rgba(47,72,88,0.16), -14px -14px 30px rgba(255,255,255,0.84), inset 1px 1px 0 rgba(255,255,255,0.74), inset -1px -1px 0 rgba(175,196,206,0.42)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-4 md:inset-5 rounded-[1.6rem] border border-white/45"
        style={{
          boxShadow:
            'inset 10px 10px 22px rgba(47,72,88,0.08), inset -9px -9px 18px rgba(255,255,255,0.46)',
        }}
      />
      {/* Background gradient effects */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-0 left-0 w-64 h-64 bg-[#2EFCDC]/24 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-0 right-0 w-64 h-64 bg-[#00B0BC]/18 rounded-full blur-3xl"
      />

      <div className="absolute inset-0 flex items-center justify-center px-3 md:px-6">
        <div className="relative w-full max-w-[1120px] h-[300px] md:h-[330px]">
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge) => {
              const fromNode = nodeMap[edge.from];
              const toNode = nodeMap[edge.to];

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <motion.line
                    x1={`${fromNode.x}%`}
                    y1={`${fromNode.y}%`}
                    x2={`${toNode.x}%`}
                    y2={`${toNode.y}%`}
                    stroke={edge.stroke}
                    strokeWidth={4}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.42 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: edge.delay }}
                  />

                  <motion.circle
                    r={isMobile ? 4 : 5}
                    fill={edge.particle}
                    animate={{
                      cx: [`${fromNode.x}%`, `${toNode.x}%`, `${fromNode.x}%`],
                      cy: [`${fromNode.y}%`, `${toNode.y}%`, `${fromNode.y}%`],
                      opacity: [0.92, 0.78, 0.92],
                    }}
                    transition={{
                      duration: 4.4,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: edge.delay,
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, index) => (
            <ChainNode key={node.id} node={node} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </div>
  );
}