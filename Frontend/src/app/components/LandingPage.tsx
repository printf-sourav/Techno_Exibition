import { motion } from 'motion/react';
import { AnimatedHero } from './AnimatedHero';
import { BackgroundEffects } from './BackgroundEffects';
import { SupplyChainThree } from './SupplyChainThree';
import { MedicineParticlesBackground } from './MedicineParticlesBackground';
import { AlertCircle, Package, TrendingDown, Leaf } from 'lucide-react';
import { Button } from './ui/button';

const problemCards = [
  {
    icon: AlertCircle,
    title: 'Expired Medicines',
    description: 'Billions worth of medicines expire annually in retail pharmacies',
    color: 'from-red-500/20 to-orange-500/20',
  },
  {
    icon: Package,
    title: 'Unsold Inventory',
    description: 'Overstocked medicines create financial losses for retailers',
    color: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    icon: TrendingDown,
    title: 'Compliance Penalties',
    description: 'Regulatory fines for improper medicine disposal practices',
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Leaf,
    title: 'Environmental Pollution',
    description: 'Pharmaceutical waste contaminates water and soil ecosystems',
    color: 'from-green-500/20 to-teal-500/20',
  },
];

const workflowSteps = [
  {
    number: 1,
    title: 'Retailer Inventory Tracking',
    description: 'Real-time monitoring of medicine stock and expiry dates',
  },
  {
    number: 2,
    title: 'AI Expiry Alerts',
    description: 'Intelligent predictions and alerts for upcoming expirations',
  },
  {
    number: 3,
    title: 'Redistribution to Hospitals',
    description: 'Connect with hospitals needing your soon-to-expire medicines',
  },
  {
    number: 4,
    title: 'Donation to NGOs',
    description: 'Enable charitable distribution to underserved communities',
  },
  {
    number: 5,
    title: 'Biomedical Waste Disposal',
    description: 'Certified waste facility pickup for proper disposal',
  },
];

export function LandingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 relative">
      <BackgroundEffects />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none z-10" />
        
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="z-20"
            >
              <div className="inline-block px-4 py-2 bg-teal-500/10 backdrop-blur-sm rounded-full mb-6">
                <span className="text-sm text-teal-600">Medisync Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-gray-900 via-teal-800 to-cyan-700 bg-clip-text text-transparent">
                Eliminating Medicine Waste with Intelligent Redistribution
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Medisync connects pharmacies, hospitals, NGOs, and waste facilities into a smart circular pharmaceutical ecosystem.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => onNavigate('login')}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg shadow-lg shadow-teal-500/30"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 border-teal-500/30 text-teal-700 hover:bg-teal-50 px-8 py-6 text-lg"
                >
                  See Workflow
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 blur-3xl rounded-full" />
              <AnimatedHero />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="container mx-auto px-6 py-20 relative">
        {/* Three.js medicine particles background */}
        <div className="absolute inset-0 -z-10">
          <MedicineParticlesBackground />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl mb-4">The Problem We're Solving</h2>
          <p className="text-xl text-gray-600">Critical challenges in the pharmaceutical supply chain</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problemCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative group bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Solution Workflow Section */}
      <div id="workflow" className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl mb-4">How Medisync Works</h2>
          <p className="text-xl text-gray-600">A complete lifecycle management system</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {index < workflowSteps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-teal-500 to-cyan-500 -z-10" />
              )}
              
              <div className="flex gap-6 mb-12">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-teal-500/30">
                    {step.number}
                  </div>
                </div>
                
                <div className="flex-1 bg-white backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-teal-200">
                  <h3 className="text-2xl mb-2 group-hover:text-teal-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            onClick={() => onNavigate('dashboard')}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-10 py-6 text-lg shadow-lg shadow-teal-500/30"
          >
            Explore Dashboard
          </Button>
        </motion.div>
      </div>

      {/* Three.js Supply Chain Visualization */}
      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl mb-4">Connected Ecosystem</h2>
          <p className="text-xl text-gray-600">Visualizing the medicine redistribution network</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <SupplyChainThree />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our intelligent platform seamlessly connects all stakeholders in the pharmaceutical supply chain, 
            ensuring efficient medicine redistribution and proper waste management.
          </p>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-12 text-center shadow-2xl"
        >
          <h2 className="text-4xl text-white mb-4">Ready to Transform Medicine Management?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join Medisync today and be part of the circular pharmaceutical economy
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate('login')}
            className="bg-white text-teal-600 hover:bg-gray-50 px-10 py-6 text-lg shadow-xl"
          >
            Get Started Now
          </Button>
        </motion.div>
      </div>
    </div>
  );
}