import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Package, TrendingUp, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { FloatingCapsules } from './FloatingCapsules';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  createNgoNeedApi,
  getDonationsApi,
  getNgoNeedsApi,
  markDonationDistributedApi,
  type Donation,
  type NgoNeed,
} from '../lib/api';

export function NGODashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout, token } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'requests' | 'inventory'>('requests');
  const [needs, setNeeds] = useState<NgoNeed[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingNeed, setSubmittingNeed] = useState(false);
  const [needForm, setNeedForm] = useState({
    medicineName: '',
    quantity: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    location: user?.address || '',
  });

  const loadNgoData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const [needsData, donationsData] = await Promise.all([
        getNgoNeedsApi(token, { onlyMine: true }),
        getDonationsApi(token),
      ]);

      setNeeds(needsData);
      setDonations(donationsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load NGO dashboard data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNgoData();
  }, [token]);

  const handleCreateNeed = async () => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    const quantity = Number(needForm.quantity);
    if (!needForm.medicineName.trim() || !Number.isFinite(quantity) || quantity <= 0 || !needForm.location.trim()) {
      toast.error('Please fill all need fields correctly');
      return;
    }

    try {
      setSubmittingNeed(true);
      await createNgoNeedApi(token, {
        medicineName: needForm.medicineName.trim(),
        quantity,
        urgency: needForm.urgency,
        location: needForm.location.trim(),
      });

      toast.success('Need created successfully');
      setNeedForm({
        medicineName: '',
        quantity: '',
        urgency: 'medium',
        location: user?.address || '',
      });
      await loadNgoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create need';
      toast.error(message);
    } finally {
      setSubmittingNeed(false);
    }
  };

  const handleMarkDistributed = async (donationId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      await markDonationDistributedApi(token, donationId);
      toast.success('Donation marked as distributed');
      await loadNgoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update donation status';
      toast.error(message);
    }
  };

  const totalReceived = useMemo(
    () => donations.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [donations]
  );
  const totalDistributed = useMemo(
    () =>
      donations
        .filter((item) => item.status === 'distributed')
        .reduce((sum, item) => sum + (item.quantity || 0), 0),
    [donations]
  );
  const activeNeeds = useMemo(
    () => needs.filter((item) => item.status === 'open' || item.status === 'partially_fulfilled').length,
    [needs]
  );
  const activeDonors = useMemo(() => {
    const donors = new Set(
      donations
        .map((item) => item.donorId?._id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );
    return donors.size;
  }, [donations]);

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
              <h3 className="text-3xl mb-1">{totalReceived}</h3>
              <p className="text-sm text-gray-600">Packets received</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500">
              <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-3xl mb-1">{totalDistributed}</h3>
              <p className="text-sm text-gray-600">Packets distributed</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500">
              <Users className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-3xl mb-1">{activeNeeds}</h3>
              <p className="text-sm text-gray-600">Active NGO needs</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-pink-500">
              <Heart className="w-8 h-8 text-pink-500 mb-3" />
              <h3 className="text-3xl mb-1">{activeDonors}</h3>
              <p className="text-sm text-gray-600">Active donor partners</p>
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

              {loading && (
                <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-200">
                  Loading NGO data...
                </div>
              )}

              {!loading && selectedTab === 'requests' ? (
                <div className="space-y-4">
                  {needs.length === 0 && (
                    <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-200">
                      No donation needs yet. Create your first need below.
                    </div>
                  )}

                  {needs.map((request, index) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg mb-2">{request.medicineName}</h3>
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
                              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
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
                          <Badge
                            className={
                              request.status === 'fulfilled'
                                ? 'bg-green-100 text-green-700'
                                : request.status === 'partially_fulfilled'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700'
                            }
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className="p-4 bg-white rounded-xl border border-purple-100 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Create New Need</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="ngo-need-medicine">Medicine Name</Label>
                        <Input
                          id="ngo-need-medicine"
                          value={needForm.medicineName}
                          onChange={(event) =>
                            setNeedForm((prev) => ({ ...prev, medicineName: event.target.value }))
                          }
                          placeholder="e.g. Amoxicillin 500mg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ngo-need-quantity">Quantity</Label>
                        <Input
                          id="ngo-need-quantity"
                          type="number"
                          min="1"
                          value={needForm.quantity}
                          onChange={(event) =>
                            setNeedForm((prev) => ({ ...prev, quantity: event.target.value }))
                          }
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ngo-need-urgency">Urgency</Label>
                        <select
                          id="ngo-need-urgency"
                          value={needForm.urgency}
                          onChange={(event) =>
                            setNeedForm((prev) => ({
                              ...prev,
                              urgency: event.target.value as 'low' | 'medium' | 'high',
                            }))
                          }
                          className="mt-2 w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="ngo-need-location">Location</Label>
                        <Input
                          id="ngo-need-location"
                          value={needForm.location}
                          onChange={(event) =>
                            setNeedForm((prev) => ({ ...prev, location: event.target.value }))
                          }
                          placeholder="Distribution location"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateNeed}
                      disabled={submittingNeed}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      {submittingNeed ? 'Creating...' : 'Create New Request'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!loading && donations.length === 0 && (
                    <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-200">
                      No donations received yet.
                    </div>
                  )}

                  {donations.map((donation, index) => (
                    <motion.div
                      key={donation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg mb-2">{donation.inventoryItemId?.name || donation.ngoNeedId?.medicineName || 'Medicine'}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span>{donation.quantity} units</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>From: {donation.donorId?.organizationName || donation.donorId?.name || 'Retailer'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={
                              donation.status === 'distributed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {donation.status}
                          </Badge>
                          {donation.status !== 'distributed' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkDistributed(donation._id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Distributed
                            </Button>
                          )}
                        </div>
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
                <div className="text-4xl mb-2">{totalDistributed}</div>
                <p className="text-sm opacity-90">Packets distributed to communities</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span>Open needs</span>
                    <span className="font-semibold">{activeNeeds}</span>
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
                  <Button className="w-full justify-start" variant="outline" onClick={() => setSelectedTab('requests')}>
                    <Package className="w-4 h-4 mr-2" />
                    Create Donation Request
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setSelectedTab('inventory')}>
                    <MapPin className="w-4 h-4 mr-2" />
                    View Received Donations
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={loadNgoData}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Refresh NGO Data
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
