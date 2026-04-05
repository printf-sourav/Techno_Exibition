import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Package, TrendingUp, Filter, CheckCircle, Star, LogOut, Building2, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { RequestMedicineModal } from './modals/RequestMedicineModal';
import { CreateRequestModal } from './modals/CreateRequestModal';
import { FloatingCapsules } from './FloatingCapsules';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  acceptHospitalOfferApi,
  createMarketplaceRequestApi,
  getHospitalIncomingOffersApi,
  getHospitalMedicinesApi,
  getMarketplaceRequestsApi,
  type Offer,
} from '../lib/api';

export function HospitalMarketplace({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRequestMedicine = (medicineName: string) => {
    setSelectedMedicine(medicineName);
    setRequestModalOpen(true);
  };

  const { logout, token } = useAuth();

  const getDaysToExpiry = (expiryDate?: string) => {
    if (!expiryDate) {
      return 90;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const resolveUrgency = (days: number) => {
    if (days <= 10) {
      return 'critical';
    }
    if (days <= 30) {
      return 'high';
    }
    if (days <= 60) {
      return 'medium';
    }
    return 'low';
  };

  const loadMarketplaceData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const [medicines, requests, incomingOffers] = await Promise.all([
        getHospitalMedicinesApi(token),
        getMarketplaceRequestsApi(token),
        getHospitalIncomingOffersApi(token),
      ]);

      const mappedMedicines = medicines.map((offer: Offer) => {
        const days = getDaysToExpiry(offer.inventoryItemId?.expiryDate);
        return {
          id: offer._id,
          name: offer.medicineName,
          retailer: offer.retailerId?.organizationName || offer.retailerId?.name || 'Retailer',
          quantity: offer.quantity,
          expiry: `${Math.max(days, 0)} days`,
          distance: 'network',
          price: `₹${Math.round(offer.totalPrice).toLocaleString()}`,
          discount: 'Marketplace rate',
          rating: 4.8,
          urgency: resolveUrgency(days),
        };
      });

      const mappedRequests = requests.map((request) => ({
        id: request._id,
        medicine: request.medicineName,
        quantity: request.quantity,
        status: request.status,
        matches: request.status === 'matched' ? 1 : 0,
      }));

      const mappedIncoming = incomingOffers.map((offer) => ({
        id: offer._id,
        medicineName: offer.medicineName,
        retailerName: offer.retailerId?.organizationName || offer.retailerId?.name || 'Retailer',
        quantity: offer.quantity,
        pricePerPacket: offer.pricePerPacket,
        totalPrice: offer.totalPrice,
        location: 'network',
      }));

      setAvailableMedicines(mappedMedicines);
      setMyRequests(mappedRequests);
      setIncomingRequests(mappedIncoming);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load marketplace data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [token]);

  const createRequest = async (payload: {
    medicineName: string;
    quantity: number;
    priority: 'low' | 'medium' | 'high';
  }) => {
    if (!token) {
      throw new Error('Please login again to continue');
    }

    await createMarketplaceRequestApi(token, payload);
    await loadMarketplaceData();
  };

  const handleAcceptIncomingOffer = async (offerId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      await acceptHospitalOfferApi(token, offerId);
      toast.success('Offer accepted successfully');
      await loadMarketplaceData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept offer';
      toast.error(message);
    }
  };

  const filteredMedicines = availableMedicines.filter((medicine) => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (selectedFilter === 'all') {
      return true;
    }

    if (selectedFilter === 'critical') {
      return medicine.urgency === 'critical' || medicine.urgency === 'high';
    }

    if (selectedFilter === 'nearby') {
      return true;
    }

    if (selectedFilter === 'high-discount') {
      return true;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 relative">
      <FloatingCapsules />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hospital Marketplace
              </h1>
              <p className="text-sm text-gray-500">Find medicines from nearby retailers</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('landing')}>
                Home
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500">
              <Package className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-3xl mb-1">{availableMedicines.length}</h3>
              <p className="text-sm text-gray-600">Available medicines</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500">
              <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-3xl mb-1">{myRequests.filter((request) => request.status !== 'pending').length}</h3>
              <p className="text-sm text-gray-600">Active requests matched</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-purple-500">
              <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="text-3xl mb-1">₹{incomingRequests.reduce((total, offer) => total + offer.totalPrice, 0).toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Cost savings this month</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-orange-500">
              <Clock className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-3xl mb-1">{incomingRequests.length ? 30 : 0}</h3>
              <p className="text-sm text-gray-600">Avg. delivery time (mins)</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Marketplace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-xl">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>

                <div className="flex gap-2">
                  {['all', 'critical', 'nearby', 'high-discount'].map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      onClick={() => setSelectedFilter(filter)}
                      className={selectedFilter === filter ? 'bg-blue-500' : ''}
                    >
                      {filter.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Available Medicines */}
            <div className="space-y-4">
              {loading && (
                <Card className="p-6 bg-white/80 backdrop-blur-xl text-sm text-gray-600">
                  Loading live marketplace inventory...
                </Card>
              )}

              {!loading && filteredMedicines.length === 0 && (
                <Card className="p-6 bg-white/80 backdrop-blur-xl text-sm text-gray-600">
                  No medicines matched your filters.
                </Card>
              )}

              {filteredMedicines.map((medicine, index) => (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-6 bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300 group relative overflow-hidden border ${
                      medicine.urgency === 'critical' ? 'border-red-200' : 'border-gray-100'
                    }`}
                  >
                    {/* Subtle pulse effect for critical medicines - more refined */}
                    {medicine.urgency === 'critical' && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/5"
                        animate={{
                          opacity: [0.05, 0.15, 0.05],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl group-hover:text-blue-600 transition-colors">
                            {medicine.name}
                          </h3>
                          <Badge
                            variant={
                              medicine.urgency === 'critical'
                                ? 'destructive'
                                : medicine.urgency === 'high'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              medicine.urgency === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : medicine.urgency === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : medicine.urgency === 'low'
                                ? 'bg-green-100 text-green-700'
                                : ''
                            }
                          >
                            {medicine.urgency}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{medicine.retailer}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{medicine.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Package className="w-4 h-4" />
                            <span>{medicine.quantity} units</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Expiry: {medicine.expiry}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{medicine.distance}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <div className="text-2xl">{medicine.price}</div>
                          <Badge className="bg-green-100 text-green-700">
                            {medicine.discount}
                          </Badge>
                        </div>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all hover:shadow-lg hover:scale-105"
                          onClick={() => handleRequestMedicine(medicine.name)}
                        >
                          Request
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Incoming Supply Offers */}
            {incomingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-xl border-2 border-teal-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <h2 className="text-xl text-teal-900">Incoming Supply Offers</h2>
                    <Badge className="bg-teal-100 text-teal-700">{incomingRequests.length} New</Badge>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {incomingRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-teal-900 mb-1">{request.medicineName}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Building2 className="w-3 h-3" />
                              <span className="font-medium">{request.retailerName}</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">New</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              Quantity:
                            </span>
                            <span className="font-medium">{request.quantity} packets</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              Price/packet:
                            </span>
                            <span className="font-medium">₹{request.pricePerPacket.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-teal-200">
                            <span className="text-gray-700 font-medium">Total:</span>
                            <span className="font-semibold text-teal-700">₹{request.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-start gap-1 pt-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{request.location}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-teal-200">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptIncomingOffer(request.id)}
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                          >
                            Accept Offer
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* My Requests */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: incomingRequests.length > 0 ? 0.1 : 0 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-xl">
                <h2 className="text-xl mb-4">My Requests</h2>
                <div className="space-y-3">
                  {!loading && myRequests.length === 0 && (
                    <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                      You have not created any medicine requests yet.
                    </div>
                  )}

                  {myRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{request.medicine}</h4>
                        <Badge
                          variant={request.status === 'matched' ? 'default' : 'secondary'}
                          className={request.status === 'matched' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{request.quantity} units</p>
                      {request.status === 'matched' && (
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {request.matches} matches found
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => setCreateRequestModalOpen(true)}
                >
                  Create New Request
                </Button>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <h2 className="text-xl mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Bulk Order Request
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Urgent Needs
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Nearby Retailers
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Savings Tracker */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                <TrendingUp className="w-10 h-10 mb-4 opacity-80" />
                <h2 className="text-xl mb-2">Total Savings</h2>
                <div className="text-4xl mb-2">₹{incomingRequests.reduce((total, offer) => total + offer.totalPrice, 0).toLocaleString()}</div>
                <p className="text-sm opacity-90">Since joining Medisync</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span>This month</span>
                    <span className="font-semibold">{myRequests.length} requests</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RequestMedicineModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        medicineName={selectedMedicine}
        onSubmitRequest={createRequest}
      />
      <CreateRequestModal
        isOpen={createRequestModalOpen}
        onClose={() => setCreateRequestModalOpen(false)}
        onSubmitRequest={createRequest}
      />
    </div>
  );
}