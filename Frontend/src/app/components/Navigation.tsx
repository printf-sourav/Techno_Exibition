import { motion } from 'motion/react';
import { Home, LayoutDashboard, Building2, Trash2, Heart } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Retailer', icon: LayoutDashboard },
    { id: 'hospital', label: 'Hospital', icon: Building2 },
    { id: 'ngo', label: 'NGO', icon: Heart },
    { id: 'waste', label: 'Waste', icon: Trash2 },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200 p-2 flex gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
              ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}