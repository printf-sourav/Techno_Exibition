import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Trash2, Calendar, MapPin, CheckCircle, Clock, TrendingUp, AlertCircle, Package, LogOut, Shield, FileText, Truck, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ReschedulePickupModal } from './modals/ReschedulePickupModal';
import { GeneralWastePickupModal } from './modals/GeneralWastePickupModal';
import { FloatingCapsules } from './FloatingCapsules';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  getWastePickupsApi,
  rescheduleWastePickupApi,
  type WastePickup,
} from '../lib/api';

const categoryColors = [
  'from-red-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-yellow-500',
  'from-emerald-500 to-teal-500',
  'from-slate-500 to-gray-600',
];

export function WasteDisposal({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { logout, token, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<WastePickup | null>(null);
  const [generalPickupModalOpen, setGeneralPickupModalOpen] = useState(false);
  const [pickups, setPickups] = useState<WastePickup[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPickups = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await getWastePickupsApi(token);
      setPickups(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load pickup requests';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, [token]);

  const groupedCategories = useMemo(() => {
    const grouped = pickups.reduce<Record<string, { amount: number; unit: 'kg' | 'packets'; items: number }>>(
      (acc, pickup) => {
        const key = pickup.wasteType || 'Unspecified waste';
        if (!acc[key]) {
          acc[key] = {
            amount: 0,
            unit: pickup.unit,
            items: 0,
          };
        }

        acc[key].amount += pickup.amount || 0;
        acc[key].items += 1;
        return acc;
      },
      {}
    );

    return Object.entries(grouped).map(([name, value], index) => ({
      id: name,
      name,
      quantity: `${Math.round(value.amount * 100) / 100} ${value.unit}`,
      items: value.items,
      color: categoryColors[index % categoryColors.length],
    }));
  }, [pickups]);

  const scheduledPickups = useMemo(
    () => pickups.filter((pickup) => pickup.status !== 'completed' && pickup.status !== 'cancelled'),
    [pickups]
  );

  const pendingAmount = useMemo(
    () =>
      pickups
        .filter((pickup) => pickup.status === 'pending' || pickup.status === 'assigned' || pickup.status === 'in_progress')
        .reduce((sum, pickup) => sum + (pickup.amount || 0), 0),
    [pickups]
  );

  const completedAmount = useMemo(
    () => pickups.filter((pickup) => pickup.status === 'completed').reduce((sum, pickup) => sum + (pickup.amount || 0), 0),
    [pickups]
  );

  const complianceRate = useMemo(() => {
    if (!pickups.length) {
      return 100;
    }

    const compliant = pickups.filter((pickup) => pickup.status === 'assigned' || pickup.status === 'completed').length;
    return Math.round((compliant / pickups.length) * 100);
  }, [pickups]);

  const onTimeRate = useMemo(() => {
    if (!pickups.length) {
      return 100;
    }

    const active = pickups.filter((pickup) => pickup.status !== 'cancelled').length;
    return Math.round((active / pickups.length) * 100);
  }, [pickups]);

  const complianceMetrics = [
    { label: 'Compliance Rate', value: complianceRate, color: 'text-green-600' },
    { label: 'On-time Pickups', value: onTimeRate, color: 'text-blue-600' },
    { label: 'Documentation', value: pickups.length > 0 ? 100 : 0, color: 'text-purple-600' },
  ];

  const handleReschedule = (pickup: WastePickup) => {
    setSelectedPickup(pickup);
    setRescheduleModalOpen(true);
  };

  const canReschedulePickup = (pickup: WastePickup) => {
    const requesterId = pickup.requesterId?._id;
    if (!requesterId || !user?.id) {
      return false;
    }

    return user.role === 'admin' || requesterId === user.id;
  };

  const submitReschedule = async (payload: {
    pickupDate: string;
    pickupTime: string;
    location?: string;
  }) => {
    if (!token || !selectedPickup?._id) {
      throw new Error('Missing pickup or session information');
    }

    await rescheduleWastePickupApi(token, selectedPickup._id, payload);
    await loadPickups();
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
              <Button variant="outline" onClick={logout}>
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
              <h3 className="text-3xl mb-1">{Math.round(pendingAmount * 100) / 100}</h3>
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
              <h3 className="text-3xl mb-1">{Math.round(completedAmount * 100) / 100}</h3>
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
              <h3 className="text-3xl mb-1">{scheduledPickups.length}</h3>
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
              <h3 className="text-3xl mb-1">{complianceRate}%</h3>
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
                {groupedCategories.map((category, index) => (
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

                {!loading && groupedCategories.length === 0 && (
                  <div className="md:col-span-2 lg:col-span-4 p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                    No waste categories yet. Schedule your first pickup request.
                  </div>
                )}
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
              {loading && (
                <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                  Loading scheduled pickups...
                </div>
              )}

              {!loading && scheduledPickups.length === 0 && (
                <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                  No scheduled pickups available.
                </div>
              )}

              {scheduledPickups.map((pickup, index) => (
                <motion.div
                  key={pickup._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">
                          {pickup.agencyId?.organizationName || pickup.agencyId?.name || pickup.requesterId?.organizationName || 'Awaiting agency assignment'}
                        </h3>
                        <Badge
                          variant={pickup.status === 'assigned' || pickup.status === 'completed' ? 'default' : 'secondary'}
                          className={pickup.status === 'assigned' || pickup.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {pickup.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Shield className="w-4 h-4" />
                        <span>{pickup.agencyId ? 'Assigned waste agency' : 'Awaiting admin assignment'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-gray-700 mb-1">
                        {pickup.amount} {pickup.unit}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(pickup.pickupDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{pickup.pickupTime || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="mb-4 text-sm text-gray-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>{pickup.location}</span>
                  </div>

                  <div className="flex gap-3">
                    {canReschedulePickup(pickup) && (
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
          pickup={{
            id: selectedPickup._id,
            date: new Date(selectedPickup.pickupDate).toLocaleDateString(),
            time: selectedPickup.pickupTime || 'Not specified',
            facility: selectedPickup.agencyId?.organizationName || selectedPickup.agencyId?.name || 'Assigned agency',
            location: selectedPickup.location,
          }}
          onSubmitReschedule={submitReschedule}
          onClose={() => setRescheduleModalOpen(false)}
        />
      )}

      {/* General Waste Pickup Modal */}
      {generalPickupModalOpen && (
        <GeneralWastePickupModal
          isOpen={generalPickupModalOpen}
          onClose={() => setGeneralPickupModalOpen(false)}
          onCreated={loadPickups}
        />
      )}
    </div>
  );
}