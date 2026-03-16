import { motion } from 'motion/react';
import { useState } from 'react';
import { Trash2, Calendar, MapPin, CheckCircle, Clock, TrendingUp, AlertCircle, Package, LogOut, Shield, FileText, Truck, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ReschedulePickupModal } from './modals/ReschedulePickupModal';
import { GeneralWastePickupModal } from './modals/GeneralWastePickupModal';
import { FloatingCapsules } from './FloatingCapsules';
import { useAuth } from '../context/AuthContext';

const wasteCategories = [
  {
    id: 1,
    name: 'Expired Solid Medicines',
    quantity: '45 kg',
    items: 23,
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 2,
    name: 'Liquid Pharmaceuticals',
    quantity: '12 L',
    items: 8,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    name: 'Contaminated Packaging',
    quantity: '18 kg',
    items: 15,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    name: 'Damaged Inventory',
    quantity: '8 kg',
    items: 5,
    color: 'from-amber-500 to-yellow-500',
  },
];

const scheduledPickups = [
  {
    id: 1,
    date: 'March 8, 2026',
    time: '10:00 AM - 12:00 PM',
    facility: 'BioMedical Waste Solutions Pvt. Ltd.',
    status: 'confirmed',
    weight: '65 kg',
    certification: 'ISO-14001 Certified',
  },
  {
    id: 2,
    date: 'March 15, 2026',
    time: '2:00 PM - 4:00 PM',
    facility: 'EcoMed Waste Management',
    status: 'pending',
    weight: '42 kg',
    certification: 'CPCB Authorized',
  },
];

const complianceMetrics = [
  { label: 'Compliance Rate', value: 98, color: 'text-green-600' },
  { label: 'On-time Pickups', value: 95, color: 'text-blue-600' },
  { label: 'Documentation', value: 100, color: 'text-purple-600' },
];

export function WasteDisposal({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<typeof scheduledPickups[0] | null>(null);
  const [generalPickupModalOpen, setGeneralPickupModalOpen] = useState(false);

  const handleReschedule = (pickup: typeof scheduledPickups[0]) => {
    setSelectedPickup(pickup);
    setRescheduleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-slate-50/40 relative">
      <FloatingCapsules />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl bg-gradient-to-r from-gray-800 to-slate-700 bg-clip-text text-transparent">
                Biomedical Waste Disposal
              </h1>
              <p className="text-sm text-gray-500">Certified waste management portal</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('landing')}>
                Home
              </Button>
              <Button variant="outline" onClick={() => onNavigate('dashboard')}>
                Retailer View
              </Button>
              <Button variant="outline" onClick={() => onNavigate('hospital')}>
                Hospital View
              </Button>
              <Button variant="outline" onClick={() => useAuth().logout()}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-red-500">
              <Trash2 className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="text-3xl mb-1">83 kg</h3>
              <p className="text-sm text-gray-600">Pending disposal this month</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500">
              <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-3xl mb-1">245 kg</h3>
              <p className="text-sm text-gray-600">Safely disposed this year</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500">
              <Calendar className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-3xl mb-1">2</h3>
              <p className="text-sm text-gray-600">Upcoming scheduled pickups</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-purple-500">
              <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="text-3xl mb-1">100%</h3>
              <p className="text-sm text-gray-600">Compliance rate</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Waste Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Waste Categories</h2>
                  <p className="text-sm text-gray-500">Current inventory pending disposal</p>
                </div>
                <Button 
                  onClick={() => setGeneralPickupModalOpen(true)}
                  className="bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Pickup
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {wasteCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedCategory === category.id
                        ? 'border-gray-400 shadow-lg scale-105'
                        : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-3`}>
                      <Trash2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-medium mb-2">{category.name}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{category.quantity}</span>
                      <span>{category.items} items</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Awaiting Retailer Scheduling</h4>
                    <p className="text-sm text-amber-700">
                      Retailers will schedule pickups for biomedical waste. Once scheduled, you can manage and reschedule appointments below.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Scheduled Pickups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl mb-1">Scheduled Pickups</h2>
                <p className="text-sm text-gray-500">Your upcoming waste collection appointments</p>
              </div>
              <Truck className="w-6 h-6 text-gray-500" />
            </div>

            <div className="space-y-4">
              {scheduledPickups.map((pickup, index) => (
                <motion.div
                  key={pickup.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">{pickup.facility}</h3>
                        <Badge
                          variant={pickup.status === 'confirmed' ? 'default' : 'secondary'}
                          className={pickup.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {pickup.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Shield className="w-4 h-4" />
                        <span>{pickup.certification}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-gray-700 mb-1">
                        {pickup.weight}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{pickup.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{pickup.time}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    {pickup.status === 'pending' && (
                      <Button size="sm" className="flex-1 bg-gray-700 hover:bg-gray-800">
                        Confirm
                      </Button>
                    )}
                    {pickup.status === 'confirmed' && (
                      <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => handleReschedule(pickup)}>
                        Reschedule
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Compliance Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl mb-1">Compliance Dashboard</h2>
                <p className="text-sm text-gray-500">Track your regulatory compliance metrics</p>
              </div>
              <FileText className="w-6 h-6 text-gray-500" />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {complianceMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-4xl mb-2 ${metric.color}`}>
                    {metric.value}%
                  </div>
                  <div className="mb-3">
                    <Progress value={metric.value} className="h-2" />
                  </div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Certifications Valid</h4>
                </div>
                <p className="text-sm text-green-700">
                  All required documentation is up to date and compliant with regulatory standards.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Documentation Complete</h4>
                </div>
                <p className="text-sm text-blue-700">
                  All disposal records and manifests are properly maintained and accessible.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Reschedule Pickup Modal */}
      {rescheduleModalOpen && selectedPickup && (
        <ReschedulePickupModal
          isOpen={rescheduleModalOpen}
          pickup={selectedPickup}
          onClose={() => setRescheduleModalOpen(false)}
        />
      )}

      {/* General Waste Pickup Modal */}
      {generalPickupModalOpen && (
        <GeneralWastePickupModal
          isOpen={generalPickupModalOpen}
          onClose={() => setGeneralPickupModalOpen(false)}
        />
      )}
    </div>
  );
}