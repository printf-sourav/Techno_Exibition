import { motion } from 'motion/react';
import { useState } from 'react';
import { Store, Building2, Heart, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useAuth, UserRole } from '../../context/AuthContext';

// Admin role removed from public signup - admins are created via database/backend
const roles = {
  retailer: { name: 'Retailer', icon: Store, color: 'from-teal-500 to-cyan-500' },
  hospital: { name: 'Hospital', icon: Building2, color: 'from-blue-500 to-indigo-500' },
  ngo: { name: 'NGO', icon: Heart, color: 'from-purple-500 to-pink-500' },
  waste: { name: 'Waste Agency', icon: Trash2, color: 'from-gray-600 to-slate-600' },
};

interface SignupPageProps {
  role: UserRole;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

export function SignupPage({ role, onNavigate, onBack }: SignupPageProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    if (file) {
      // Mock file upload - in production this would upload to a server
      setFormData((prev: any) => ({ ...prev, [field]: file.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prevent admin signup through this form (security measure)
    if (role === 'admin') {
      setLoading(false);
      setError('Admin accounts cannot be created through public signup. Please contact system administrator.');
      return;
    }

    const userData = {
      ...formData,
      role,
    };

    const success = await signup(userData);
    setLoading(false);

    if (success) {
      // Navigate to pending approval page instead of dashboard
      onNavigate('pending');
    } else {
      setError('Email already exists. Please use a different email.');
    }
  };

  // Safety check - if somehow admin role is passed, show error
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Admin accounts cannot be created through public signup. Please contact the system administrator.
          </p>
          <Button onClick={onBack} className="w-full">
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  const roleConfig = roles[role as keyof typeof roles];
  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="outline" onClick={onBack} className="mb-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-8 bg-white/80 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`w-20 h-20 bg-gradient-to-br ${roleConfig.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl mb-2">Sign Up as {roleConfig.name}</h2>
              <p className="text-gray-600">Create your account and get verified</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {role === 'retailer' ? 'Owner Name' : 'Contact Person Name'} *
                  </label>
                  <Input
                    placeholder="Enter name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {role === 'retailer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pharmacy Name *</label>
                    <Input
                      placeholder="Enter pharmacy name"
                      value={formData.organizationName || ''}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Drug License Number *</label>
                      <Input
                        placeholder="Enter license number"
                        value={formData.licenseNumber || ''}
                        onChange={(e) => handleChange('licenseNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">GST Number *</label>
                      <Input
                        placeholder="Enter GST number"
                        value={formData.gstNumber || ''}
                        onChange={(e) => handleChange('gstNumber', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Drug License Certificate *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('licenseCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                        id="license-upload"
                      />
                      <label htmlFor="license-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.licenseCertificate || 'Click to upload PDF or Image'}
                        </p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {role === 'hospital' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Name *</label>
                    <Input
                      placeholder="Enter hospital name"
                      value={formData.organizationName || ''}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Registration Number *</label>
                    <Input
                      placeholder="Enter registration number"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Hospital License *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('registrationCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                        id="hospital-upload"
                      />
                      <label htmlFor="hospital-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.registrationCertificate || 'Click to upload PDF or Image'}
                        </p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {role === 'ngo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">NGO Name *</label>
                    <Input
                      placeholder="Enter NGO name"
                      value={formData.organizationName || ''}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">NGO Registration Number *</label>
                      <Input
                        placeholder="Enter registration number"
                        value={formData.registrationNumber || ''}
                        onChange={(e) => handleChange('registrationNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">PAN / Tax Number *</label>
                      <Input
                        placeholder="Enter PAN number"
                        value={formData.panNumber || ''}
                        onChange={(e) => handleChange('panNumber', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload NGO Registration Certificate *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('registrationCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                        id="ngo-upload"
                      />
                      <label htmlFor="ngo-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.registrationCertificate || 'Click to upload PDF or Image'}
                        </p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {role === 'waste' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <Input
                      placeholder="Enter company name"
                      value={formData.organizationName || ''}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Biomedical Waste Handling License *</label>
                    <Input
                      placeholder="Enter license number"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Service Area *</label>
                    <Input
                      placeholder="e.g., Mumbai, Pune"
                      value={formData.serviceArea || ''}
                      onChange={(e) => handleChange('serviceArea', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Authorization Certificate *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('authorizationCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                        id="waste-upload"
                      />
                      <label htmlFor="waste-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.authorizationCertificate || 'Click to upload PDF or Image'}
                        </p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields Continued */}
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <Input
                  placeholder="Enter full address"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Number *</label>
                  <Input
                    type="tel"
                    placeholder="Enter contact number"
                    value={formData.contactNumber || ''}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <Input
                    type="password"
                    placeholder="Create password"
                    value={formData.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className={`w-full bg-gradient-to-r ${roleConfig.color} text-white py-6`}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Your account will be pending verification until approved by an administrator.
                </p>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}