import { motion } from 'motion/react';
import { useState } from 'react';
import { Store, Building2, Heart, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useAuth, UserRole } from '../../context/AuthContext';

const roles = [
  {
    id: 'retailer' as UserRole,
    name: 'Retailer',
    description: 'Pharmacy / Medical Store',
    icon: Store,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'from-teal-50 to-cyan-50',
    allowSignup: true,
  },
  {
    id: 'hospital' as UserRole,
    name: 'Hospital',
    description: 'Healthcare Facility',
    icon: Building2,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'from-blue-50 to-indigo-50',
    allowSignup: true,
  },
  {
    id: 'ngo' as UserRole,
    name: 'NGO',
    description: 'Non-Profit Organization',
    icon: Heart,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    allowSignup: true,
  },
  {
    id: 'waste' as UserRole,
    name: 'Waste Agency',
    description: 'Biomedical Waste Disposal',
    icon: Trash2,
    color: 'from-gray-600 to-slate-600',
    bgColor: 'from-gray-50 to-slate-50',
    allowSignup: true,
  },
  {
    id: 'admin' as UserRole,
    name: 'Admin',
    description: 'Platform Administrator',
    icon: Shield,
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    allowSignup: false, // Admin accounts cannot be created through public signup
  },
];

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onSignup: (role: UserRole) => void;
}

export function LoginPage({ onNavigate, onSignup }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    // Check if account is pending or rejected before attempting login
    const mockUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    const foundUser = mockUsers.find(
      (u: any) => u.email === email && u.password === password && u.role === selectedRole
    );

    if (foundUser) {
      if (foundUser.verificationStatus === 'pending') {
        setLoading(false);
        setError('Your account is still awaiting admin approval. Please wait for verification.');
        return;
      }

      if (foundUser.verificationStatus === 'rejected') {
        setLoading(false);
        setError('Your account has been rejected. Please contact support@medisync.com for assistance.');
        return;
      }
    }

    const success = await login(email, password, selectedRole);
    
    setLoading(false);

    if (success) {
      // Navigate to appropriate dashboard
      const dashboardMap: Record<UserRole, string> = {
        retailer: 'dashboard',
        hospital: 'hospital',
        ngo: 'ngo',
        waste: 'waste',
        admin: 'admin',
      };
      onNavigate(dashboardMap[selectedRole]);
    } else {
      setError('Invalid credentials. Try demo@retailer.com / demo or admin@medisync.com / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 80,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="outline"
            onClick={() => onNavigate('landing')}
            className="mb-8 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl mb-4 bg-gradient-to-r from-gray-900 via-teal-800 to-cyan-700 bg-clip-text text-transparent">
            Welcome to Medisync
          </h1>
          <p className="text-xl text-gray-600">Select your role to continue</p>
        </motion.div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedRole(role.id)}
                  className="cursor-pointer"
                >
                  <Card className={`p-6 bg-gradient-to-br ${role.bgColor} border-2 border-transparent hover:border-gray-300 transition-all duration-300 group`}>
                    <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <role.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl mb-2">{role.name}</h3>
                    <p className="text-gray-600">{role.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Login Form */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-8 bg-white/80 backdrop-blur-xl shadow-2xl">
              {/* Selected Role Display */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${roles.find(r => r.id === selectedRole)?.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {roles.find(r => r.id === selectedRole)?.icon && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                    >
                      {(() => {
                        const Icon = roles.find(r => r.id === selectedRole)!.icon;
                        return <Icon className="w-10 h-10 text-white" />;
                      })()}
                    </motion.div>
                  )}
                </div>
                <h2 className="text-2xl mb-2">
                  Login as {roles.find(r => r.id === selectedRole)?.name}
                </h2>
                <Button
                  variant="link"
                  onClick={() => setSelectedRole(null)}
                  className="text-sm text-gray-600"
                >
                  Change role
                </Button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
                  className={`w-full bg-gradient-to-r ${roles.find(r => r.id === selectedRole)?.color} text-white py-6`}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                {/* Only show signup option for non-admin roles */}
                {roles.find(r => r.id === selectedRole)?.allowSignup && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      Don't have an account?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSignup(selectedRole)}
                      className="w-full"
                    >
                      Sign Up as {roles.find(r => r.id === selectedRole)?.name}
                    </Button>
                  </div>
                )}
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2 font-medium">Demo Credentials:</p>
                <p className="text-xs text-gray-600">Retailer: demo@retailer.com / demo</p>
                <p className="text-xs text-gray-600">Admin: admin@medisync.com / admin123</p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}