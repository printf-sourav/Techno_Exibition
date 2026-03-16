import { motion } from 'motion/react';
import { useState } from 'react';
import { Heart, Package, TrendingUp, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { FloatingCapsules } from './FloatingCapsules';

const donationRequests = [
  {
    id: 1,
    medicine: 'Paracetamol 500mg',
    quantity: 500,
    urgency: 'high',
    location: 'Mumbai Central',
    date: '2024-03-20',
  },
  {
    id: 2,
    medicine: 'Vitamin D3',
    quantity: 200,
    urgency: 'medium',
    location: 'Andheri West',
    date: '2024-03-22',
  },
];

const receivedDonations = [
  {
    id: 1,
    medicine: 'Metformin 850mg',
    quantity: 180,
    donor: 'MedPlus Pharmacy',
    receivedDate: '2024-03-15',
    status: 'distributed',
  },
  {
    id: 2,
    medicine: 'Amoxicillin 500mg',
    quantity: 150,
    donor: 'Apollo Pharmacy',
    receivedDate: '2024-03-18',
    status: 'in-stock',
  },
];

export function NGODashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'requests' | 'inventory'>('requests');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-pink-50/40 relative">
      <FloatingCapsules />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  NGO Dashboard
                </h1>
                <p className="text-sm text-gray-500">{user?.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.verificationStatus === 'pending' && (
                <Badge className="bg-orange-100 text-orange-700">
                  Pending Verification
                </Badge>
              )}
              {user?.verificationStatus === 'verified' && (
                <Badge className="bg-green-100 text-green-700">
                  Verified
                </Badge>
              )}
              <Button variant="outline" onClick={() => onNavigate('landing')}>
                Home
              </Button>
              <Button variant="outline" onClick={() => onNavigate('dashboard')}>
                Retailer View
              </Button>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Verification Notice */}
        {user?.verificationStatus === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <p className="text-orange-800">
              ⚠️ Your account is pending verification. Some features may be limited until approved by an administrator.
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-purple-500">
              <Package className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="text-3xl mb-1">320</h3>
              <p className="text-sm text-gray-600">Total medicines received</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500">
              <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-3xl mb-1">245</h3>
              <p className="text-sm text-gray-600">Medicines distributed</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500">
              <Users className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-3xl mb-1">1,240</h3>
              <p className="text-sm text-gray-600">People helped</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-pink-500">
              <Heart className="w-8 h-8 text-pink-500 mb-3" />
              <h3 className="text-3xl mb-1">18</h3>
              <p className="text-sm text-gray-600">Active partnerships</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Card className="p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex gap-4 mb-6">
                <Button
                  variant={selectedTab === 'requests' ? 'default' : 'outline'}
                  onClick={() => setSelectedTab('requests')}
                  className={selectedTab === 'requests' ? 'bg-purple-500' : ''}
                >
                  Donation Requests
                </Button>
                <Button
                  variant={selectedTab === 'inventory' ? 'default' : 'outline'}
                  onClick={() => setSelectedTab('inventory')}
                  className={selectedTab === 'inventory' ? 'bg-purple-500' : ''}
                >
                  Received Inventory
                </Button>
              </div>

              {selectedTab === 'requests' ? (
                <div className="space-y-4">
                  {donationRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg mb-2">{request.medicine}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span>{request.quantity} units needed</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{request.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={request.urgency === 'high' ? 'destructive' : 'default'}
                            className={request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                          >
                            {request.urgency}
                          </Badge>
                          <Button size="sm">View Matches</Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Button className="w-full" variant="outline">
                    Create New Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedDonations.map((donation, index) => (
                    <motion.div
                      key={donation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg mb-2">{donation.medicine}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span>{donation.quantity} units</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>From: {donation.donor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{donation.receivedDate}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={
                            donation.status === 'distributed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {donation.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Heart className="w-10 h-10 mb-4 opacity-80" />
                <h2 className="text-xl mb-2">Lives Impacted</h2>
                <div className="text-4xl mb-2">1,240+</div>
                <p className="text-sm opacity-90">People received free medicines</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span>This month</span>
                    <span className="font-semibold">↑ 18%</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-xl">
                <h2 className="text-xl mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Create Donation Request
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Nearby Donors
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Impact Report
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
