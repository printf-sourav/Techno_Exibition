import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Eye, Users, TrendingUp, AlertCircle, Truck, MapPin, Calendar, Clock, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import {
  approveUserApi,
  assignWastePickupApi,
  getAdminUsersApi,
  getPendingUsersApi,
  getWastePickupsApi,
  rejectUserApi,
  type BackendUser,
  type UserRole,
  type WastePickup,
} from '../lib/api';

export function AdminDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<BackendUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [wastePickupRequests, setWastePickupRequests] = useState<WastePickup[]>([]);
  const [allUsers, setAllUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgencies, setSelectedAgencies] = useState<Record<string, string>>({});

  const getUserId = (item: BackendUser) => item._id || item.id || '';

  const nearbyAgencies = allUsers.filter(
    (item) => item.role === 'waste' && item.verificationStatus === 'verified'
  );

  const loadAdminData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const [pending, users, pickups] = await Promise.all([
        getPendingUsersApi(token),
        getAdminUsersApi(token),
        getWastePickupsApi(token),
      ]);

      setPendingUsers(pending.filter((u) => u.role !== 'admin'));
      setAllUsers(users);
      setWastePickupRequests(pickups);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load admin dashboard data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleApprove = async (userId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      await approveUserApi(token, userId);
      setSelectedUser(null);
      toast.success('User approved successfully!');
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve user';
      toast.error(message);
    }
  };

  const handleReject = async (userId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      await rejectUserApi(token, userId);
      setSelectedUser(null);
      toast.error('User rejected successfully!');
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject user';
      toast.error(message);
    }
  };

  const handleAssignAgency = async (requestId: string, agencyId: string) => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      await assignWastePickupApi(token, requestId, agencyId);

      const agency = nearbyAgencies.find((a) => getUserId(a) === agencyId);
      toast.success(`Pickup request assigned to ${agency?.organizationName || agency?.name || 'selected agency'}.`, {
        description: agency?.serviceArea || agency?.address || 'Agency notified successfully',
        duration: 5000,
      });

      setSelectedAgencies((prev) => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });

      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign agency';
      toast.error(message);
    }
  };

  const handleSelectAgency = (requestId: string, agencyId: string) => {
    setSelectedAgencies((prev) => ({ ...prev, [requestId]: agencyId }));
  };

  const verifiedCount = allUsers.filter((item) => item.verificationStatus === 'verified').length;
  const rejectedCount = allUsers.filter((item) => item.verificationStatus === 'rejected').length;
  const countByRole = (role: UserRole) => allUsers.filter((item) => item.role === role).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-red-50/40">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">Platform Management & Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-orange-500">
              <AlertCircle className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-3xl mb-1">{pendingUsers.length}</h3>
              <p className="text-sm text-gray-600">Pending Verification</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-green-500">
              <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-3xl mb-1">{verifiedCount}</h3>
              <p className="text-sm text-gray-600">Verified Users</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-red-500">
              <XCircle className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="text-3xl mb-1">{rejectedCount}</h3>
              <p className="text-sm text-gray-600">Rejected</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-l-4 border-l-blue-500">
              <Users className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-3xl mb-1">{allUsers.length}</h3>
              <p className="text-sm text-gray-600">Total Users</p>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Verification Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl mb-4">Verification Queue</h2>

            {loading && (
              <Card className="p-4 bg-white/80 backdrop-blur-xl text-sm text-gray-600">
                Loading admin data...
              </Card>
            )}
            
            {pendingUsers.length === 0 ? (
              <Card className="p-12 bg-white/80 backdrop-blur-xl text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending verifications at the moment.</p>
              </Card>
            ) : (
              pendingUsers.map((user, index) => (
                <motion.div
                  key={getUserId(user)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl">{user.organizationName}</h3>
                          <Badge className="bg-orange-100 text-orange-700">
                            {user.role}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Contact:</strong> {user.name}</p>
                          <p><strong>Email:</strong> {user.email}</p>
                          <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                          <p><strong>Address:</strong> {user.address}</p>
                          {user.licenseNumber && (
                            <p><strong>License:</strong> {user.licenseNumber}</p>
                          )}
                          {(user.hospitalRegNumber || user.ngoRegNumber || user.cpcbLicense) && (
                            <p><strong>Registration:</strong> {user.hospitalRegNumber || user.ngoRegNumber || user.cpcbLicense}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 gap-1"
                          onClick={() => handleApprove(getUserId(user))}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(getUserId(user))}
                          className="gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-xl">
                <h2 className="text-xl mb-4">Platform Overview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Retailers</span>
                      <span className="font-medium">
                        {countByRole('retailer')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{
                          width: `${(countByRole('retailer') / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hospitals</span>
                      <span className="font-medium">
                        {countByRole('hospital')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(countByRole('hospital') / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>NGOs</span>
                      <span className="font-medium">
                        {countByRole('ngo')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(countByRole('ngo') / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Waste Agencies</span>
                      <span className="font-medium">
                        {countByRole('waste')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{
                          width: `${(countByRole('waste') / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
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
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
                <h2 className="text-xl mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Platform Analytics
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Waste Pickup Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-2xl mb-4 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Waste Pickup Requests
          </h2>

          {wastePickupRequests.length === 0 ? (
            <Card className="p-12 bg-white/80 backdrop-blur-xl text-center">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Pickup Requests</h3>
              <p className="text-gray-600">There are no waste pickup requests at the moment.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wastePickupRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-5 bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">
                          {request.requesterId?.organizationName || request.requesterId?.name || 'Requester'}
                        </h3>
                        <Badge 
                          className={request.status === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                        >
                          {request.status === 'assigned' ? 'Assigned' : 'Pending'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-500">Waste Type</p>
                          <p className="font-medium">{request.wasteType}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium">{request.amount} {request.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-500">Pickup Date</p>
                          <p className="font-medium">{new Date(request.pickupDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-500">Pickup Time</p>
                          <p className="font-medium">{request.pickupTime || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-500">Location</p>
                          <p className="font-medium">{request.location}</p>
                        </div>
                      </div>
                    </div>

                    {request.status === 'pending' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-2 block">Choose Nearby Waste Pickup</label>
                          <Select 
                            value={selectedAgencies[request._id] || ''}
                            onValueChange={(value) => handleSelectAgency(request._id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select waste agency" />
                            </SelectTrigger>
                            <SelectContent>
                              {nearbyAgencies.map((agency) => (
                                <SelectItem key={getUserId(agency)} value={getUserId(agency)}>
                                  {agency.organizationName || agency.name} – {agency.serviceArea || agency.address || 'Service area'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedAgencies[request._id] && (
                          <Button
                            size="sm"
                            className="w-full bg-green-500 hover:bg-green-600 gap-2"
                            onClick={() => handleAssignAgency(request._id, selectedAgencies[request._id])}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm Assignment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900">Assigned to Agency</p>
                        </div>
                        <p className="text-xs text-green-700 font-medium">
                          {request.agencyId?.organizationName || request.agencyId?.name || 'Waste agency'}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Pickup details have been sent to the agency
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Document Viewer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <h2 className="text-2xl mb-6">User Details</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-medium">{selectedUser.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered</p>
                  <p className="font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{selectedUser.address}</p>
              </div>

              {selectedUser.licenseNumber && (
                <div>
                  <p className="text-sm text-gray-600">License Number</p>
                  <p className="font-medium">{selectedUser.licenseNumber}</p>
                </div>
              )}

              {(selectedUser.hospitalRegNumber || selectedUser.ngoRegNumber || selectedUser.cpcbLicense) && (
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium">{selectedUser.hospitalRegNumber || selectedUser.ngoRegNumber || selectedUser.cpcbLicense}</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Documents uploaded: {selectedUser.licenseCertificateUrl || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => handleApprove(getUserId(selectedUser))}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve User
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => handleReject(getUserId(selectedUser))}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject User
              </Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}