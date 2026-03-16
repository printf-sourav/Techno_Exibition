import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  AlertTriangle, 
  Package, 
  MapPin, 
  Heart, 
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity,
  DollarSign,
  Truck,
  Building2,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SellToHospitalModal } from './modals/SellToHospitalModal';
import { SupplyMedicineModal } from './modals/SupplyMedicineModal';
import { DonateToNGOModal } from './modals/DonateToNGOModal';
import { ScheduleWastePickupModal } from './modals/ScheduleWastePickupModal';
import { useAuth } from '../context/AuthContext';

const inventoryData = [
  { id: 1, name: 'Amoxicillin 500mg', quantity: 250, expiry: '45 days', status: 'warning', batch: 'AMX-2024-001', mrp: 150, gst: 18 },
  { id: 2, name: 'Metformin 850mg', quantity: 180, expiry: '15 days', status: 'critical', batch: 'MET-2024-045', mrp: 120, gst: 18 },
  { id: 3, name: 'Lisinopril 10mg', quantity: 320, expiry: '78 days', status: 'safe', batch: 'LIS-2024-023', mrp: 200, gst: 18 },
  { id: 4, name: 'Atorvastatin 20mg', quantity: 150, expiry: '30 days', status: 'warning', batch: 'ATO-2024-067', mrp: 180, gst: 18 },
  { id: 5, name: 'Omeprazole 40mg', quantity: 95, expiry: '12 days', status: 'critical', batch: 'OME-2024-089', mrp: 95, gst: 18 },
];

const hospitalDemands = [
  { id: 1, hospital: 'City General Hospital', medicine: 'Metformin 850mg', quantity: 100, distance: '2.3 km', urgency: 'high', mrp: 120 },
  { id: 2, hospital: 'St. Mary Medical Center', medicine: 'Amoxicillin 500mg', quantity: 150, distance: '4.7 km', urgency: 'medium', mrp: 150 },
  { id: 3, hospital: 'Regional Health Clinic', medicine: 'Atorvastatin 20mg', quantity: 80, distance: '3.1 km', urgency: 'high', mrp: 180 },
];

const ngoDonations = [
  { id: 1, ngo: 'Health for All Foundation', request: 'Pain Relief Medicines', items: '50+ items', verified: true },
  { id: 2, ngo: 'Medical Aid Network', request: 'Antibiotics & Antiseptics', items: '30+ items', verified: true },
  { id: 3, ngo: 'Community Care Initiative', request: 'Chronic Disease Medicines', items: '40+ items', verified: true },
];

const turnoverData = [
  { month: 'Oct', value: 78 },
  { month: 'Nov', value: 82 },
  { month: 'Dec', value: 75 },
  { month: 'Jan', value: 88 },
  { month: 'Feb', value: 92 },
  { month: 'Mar', value: 85 },
];

const expiryRiskData = [
  { month: 'Apr', value: 23 },
  { month: 'May', value: 19 },
  { month: 'Jun', value: 15 },
  { month: 'Jul', value: 12 },
  { month: 'Aug', value: 8 },
  { month: 'Sep', value: 5 },
];

export function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedMedicine, setSelectedMedicine] = useState<number | null>(null);
  
  // Modal states
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  
  // Selected items for modals
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);

  const handleSellClick = (item: any) => {
    setSelectedInventoryItem(item);
    setSellModalOpen(true);
  };

  const handleSupplyClick = (demand: any) => {
    setSelectedDemand(demand);
    setSupplyModalOpen(true);
  };

  const handleDonateClick = (item: any) => {
    setSelectedInventoryItem(item);
    setDonateModalOpen(true);
  };

  const handleWasteClick = (item: any) => {
    setSelectedInventoryItem(item);
    setWasteModalOpen(true);
  };

  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Medisync Dashboard
              </h1>
              <p className="text-sm text-gray-500">Retailer Portal</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('landing')}>
                Home
              </Button>
              <Button variant="outline" onClick={() => onNavigate('hospital')}>
                Hospital View
              </Button>
              <Button variant="outline" onClick={() => onNavigate('ngo')}>
                NGO View
              </Button>
              <Button variant="outline" onClick={() => onNavigate('waste')}>
                Waste Disposal
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <Badge variant="destructive">Critical</Badge>
              </div>
              <h3 className="text-3xl mb-1">23</h3>
              <p className="text-sm text-gray-600">Medicines approaching expiry (90 days)</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-teal-500" />
                <Badge className="bg-teal-100 text-teal-700">Active</Badge>
              </div>
              <h3 className="text-3xl mb-1">1,247</h3>
              <p className="text-sm text-gray-600">Total inventory items</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-100 text-blue-700">Nearby</Badge>
              </div>
              <h3 className="text-3xl mb-1">12</h3>
              <p className="text-sm text-gray-600">Hospitals needing medicines</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-100 text-green-700">↑ 12%</Badge>
              </div>
              <h3 className="text-3xl mb-1">₹2.3L</h3>
              <p className="text-sm text-gray-600">Recovered value this month</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Inventory Panel</h2>
                  <p className="text-sm text-gray-500">Medicines with expiry countdown timers</p>
                </div>
                <Package className="w-6 h-6 text-teal-500" />
              </div>

              <div className="space-y-4">
                {inventoryData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedMedicine(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMedicine === item.id
                        ? 'border-teal-500 bg-teal-50/50'
                        : 'border-gray-100 hover:border-teal-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500">Batch: {item.batch}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            item.status === 'critical'
                              ? 'destructive'
                              : item.status === 'warning'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            item.status === 'warning'
                              ? 'bg-orange-100 text-orange-700'
                              : item.status === 'safe'
                              ? 'bg-green-100 text-green-700'
                              : ''
                          }
                        >
                          {item.expiry}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Quantity</span>
                          <span>{item.quantity} units</span>
                        </div>
                        <Progress
                          value={(item.quantity / 500) * 100}
                          className="h-2"
                        />
                      </div>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellClick(item);
                        }}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                      >
                        <Building2 className="w-3 h-3 mr-1" />
                        Sell to Hospital
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDonateClick(item);
                        }}
                        className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Donate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWasteClick(item);
                        }}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Waste
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Alert Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl">AI Alerts</h2>
                  <p className="text-sm text-gray-600">Smart predictions</p>
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-xl border-l-4 border-l-red-500 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">
                        <span className="font-semibold">23 medicines</span> approaching expiry in 90 days
                      </p>
                      <p className="text-xs text-gray-500">Estimated loss: ₹45,000</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-xl border-l-4 border-l-orange-500 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">
                        High demand detected for <span className="font-semibold">Metformin</span> nearby
                      </p>
                      <p className="text-xs text-gray-500">3 hospitals requesting</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-xl border-l-4 border-l-green-500 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">
                        Redistribution opportunity: Save <span className="font-semibold">₹12,000</span>
                      </p>
                      <p className="text-xs text-gray-500">Match with nearby hospitals</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <Button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                View All Alerts
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Demand Map and Marketplace */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Nearby Demand Map</h2>
                  <p className="text-sm text-gray-500">Hospitals needing medicines</p>
                </div>
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>

              <div className="aspect-video bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-1/2 right-1/3 w-3 h-3 bg-orange-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-red-500 rounded-full"
                  />
                </div>
                <p className="text-gray-400">Interactive map visualization</p>
              </div>

              <div className="space-y-3">
                {hospitalDemands.map((demand) => (
                  <motion.div
                    key={demand.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{demand.hospital}</h4>
                      <Badge
                        variant={demand.urgency === 'high' ? 'destructive' : 'secondary'}
                        className={demand.urgency === 'medium' ? 'bg-orange-100 text-orange-700' : ''}
                      >
                        {demand.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{demand.medicine} • {demand.quantity} units</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {demand.distance}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSupplyClick(demand)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        Supply Medicine
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1">Donation Channel</h2>
                  <p className="text-sm text-gray-500">NGO requests</p>
                </div>
                <Heart className="w-6 h-6 text-pink-500" />
              </div>

              <div className="space-y-4">
                {ngoDonations.map((ngo) => (
                  <motion.div
                    key={ngo.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{ngo.ngo}</h4>
                          {ngo.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{ngo.request}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{ngo.items}</span>
                      <Button size="sm" variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50">
                        View Details
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total donations this year</p>
                    <p className="text-2xl">₹1.2L</p>
                  </div>
                  <Heart className="w-10 h-10 opacity-80" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <h2 className="text-xl mb-6">Inventory Turnover</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={turnoverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#colorTurnover)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <h2 className="text-xl mb-6">Expiry Risk Prediction</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={expiryRiskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Waste Disposal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-slate-700 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl mb-1">Waste Disposal Request</h2>
                  <p className="text-sm text-gray-600">Schedule pickup with certified BMW facility</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onNavigate('waste')}
                  className="border-gray-300"
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <SellToHospitalModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        medicine={selectedInventoryItem}
      />
      <SupplyMedicineModal
        isOpen={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
        demand={selectedDemand}
      />
      <DonateToNGOModal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        medicine={selectedInventoryItem}
      />
      <ScheduleWastePickupModal
        isOpen={wasteModalOpen}
        onClose={() => setWasteModalOpen(false)}
        medicine={selectedInventoryItem}
      />
    </div>
  );
}