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

export function AdminDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [wastePickupRequests, setWastePickupRequests] = useState<any[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<Record<string, string>>({});

  // Dummy nearby waste pickup agencies
  const nearbyAgencies = [
    { id: 'agency-1', name: 'EcoWaste Medical Disposal', location: 'Bengaluru' },
    { id: 'agency-2', name: 'BioClean Waste Management', location: 'Whitefield' },
    { id: 'agency-3', name: 'GreenCycle Biomedical Services', location: 'Indiranagar' },
  ];

  useEffect(() => {
    // Load pending users from localStorage
    const allUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    // Filter out admin accounts from verification queue - admins don't require approval
    const pending = allUsers.filter((u: any) => u.verificationStatus === 'pending' && u.role !== 'admin');
    setPendingUsers(pending);

    // Load waste pickup requests
    const pickupRequests = JSON.parse(localStorage.getItem('medisync_waste_pickups') || '[]');
    setWastePickupRequests(pickupRequests);
  }, []);

  const handleApprove = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    const updatedUsers = allUsers.map((u: any) =>
      u.id === userId ? { ...u, verificationStatus: 'verified' } : u
    );
    localStorage.setItem('medisync_users', JSON.stringify(updatedUsers));
    // Filter out admin accounts from verification queue
    setPendingUsers(updatedUsers.filter((u: any) => u.verificationStatus === 'pending' && u.role !== 'admin'));
    setSelectedUser(null);
    toast.success('User approved successfully!');
  };

  const handleReject = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    const updatedUsers = allUsers.map((u: any) =>
      u.id === userId ? { ...u, verificationStatus: 'rejected' } : u
    );
    localStorage.setItem('medisync_users', JSON.stringify(updatedUsers));
    // Filter out admin accounts from verification queue
    setPendingUsers(updatedUsers.filter((u: any) => u.verificationStatus === 'pending' && u.role !== 'admin'));
    setSelectedUser(null);
    toast.error('User rejected successfully!');
  };

  const handleAssignAgency = (requestId: string, agencyId: string) => {
    const pickupRequests = JSON.parse(localStorage.getItem('medisync_waste_pickups') || '[]');
    const updatedRequests = pickupRequests.map((r: any) =>
      r.id === requestId ? { ...r, assignedAgency: agencyId, status: 'assigned', assignedAgencyName: nearbyAgencies.find(a => a.id === agencyId)?.name } : r
    );
    localStorage.setItem('medisync_waste_pickups', JSON.stringify(updatedRequests));
    setWastePickupRequests(updatedRequests);
    
    const agency = nearbyAgencies.find((a) => a.id === agencyId);
    toast.success(`Pickup request assigned to ${agency?.name}. The agency has received the pickup details.`, {
      description: `${agency?.name} – ${agency?.location}`,
      duration: 5000,
    });
    
    // Clear the selection
    setSelectedAgencies(prev => {
      const newState = { ...prev };
      delete newState[requestId];
      return newState;
    });
  };

  const handleSelectAgency = (requestId: string, agencyId: string) => {
    setSelectedAgencies(prev => ({ ...prev, [requestId]: agencyId }));
  };

  const allUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
  const verifiedCount = allUsers.filter((u: any) => u.verificationStatus === 'verified').length;
  const rejectedCount = allUsers.filter((u: any) => u.verificationStatus === 'rejected').length;

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
            
            {pendingUsers.length === 0 ? (
              <Card className="p-12 bg-white/80 backdrop-blur-xl text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending verifications at the moment.</p>
              </Card>
            ) : (
              pendingUsers.map((user, index) => (
                <motion.div
                  key={user.id}
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
                          <p><strong>Phone:</strong> {user.contactNumber}</p>
                          <p><strong>Address:</strong> {user.address}</p>
                          {user.licenseNumber && (
                            <p><strong>License:</strong> {user.licenseNumber}</p>
                          )}
                          {user.registrationNumber && (
                            <p><strong>Registration:</strong> {user.registrationNumber}</p>
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
                          onClick={() => handleApprove(user.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
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
                        {allUsers.filter((u: any) => u.role === 'retailer').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{
                          width: `${(allUsers.filter((u: any) => u.role === 'retailer').length / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hospitals</span>
                      <span className="font-medium">
                        {allUsers.filter((u: any) => u.role === 'hospital').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(allUsers.filter((u: any) => u.role === 'hospital').length / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>NGOs</span>
                      <span className="font-medium">
                        {allUsers.filter((u: any) => u.role === 'ngo').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(allUsers.filter((u: any) => u.role === 'ngo').length / Math.max(allUsers.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Waste Agencies</span>
                      <span className="font-medium">
                        {allUsers.filter((u: any) => u.role === 'waste').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{
                          width: `${(allUsers.filter((u: any) => u.role === 'waste').length / Math.max(allUsers.length, 1)) * 100}%`,
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
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-5 bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{request.pharmacyName}</h3>
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
                          <p className="font-medium">{request.amount}</p>
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
                          <p className="font-medium">{request.pickupTime}</p>
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
                            value={selectedAgencies[request.id] || ''}
                            onValueChange={(value) => handleSelectAgency(request.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select waste agency" />
                            </SelectTrigger>
                            <SelectContent>
                              {nearbyAgencies.map((agency) => (
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name} – {agency.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedAgencies[request.id] && (
                          <Button
                            size="sm"
                            className="w-full bg-green-500 hover:bg-green-600 gap-2"
                            onClick={() => handleAssignAgency(request.id, selectedAgencies[request.id])}
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
                          {request.assignedAgencyName || 'Waste agency'}
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
                  <p className="font-medium">{selectedUser.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
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

              {selectedUser.registrationNumber && (
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium">{selectedUser.registrationNumber}</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📄 Documents uploaded: {selectedUser.licenseCertificate || selectedUser.registrationCertificate || selectedUser.authorizationCertificate || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => handleApprove(selectedUser.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve User
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => handleReject(selectedUser.id)}
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