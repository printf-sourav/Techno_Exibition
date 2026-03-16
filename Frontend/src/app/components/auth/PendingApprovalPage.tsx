import { motion } from 'motion/react';
import { Clock, Shield, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useEffect, useState } from 'react';

interface PendingApprovalPageProps {
  onNavigate: (page: string) => void;
}

export function PendingApprovalPage({ onNavigate }: PendingApprovalPageProps) {
  const [dots, setDots] = useState('');

  // Animated dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/40 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
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
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 80,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"
        />
        
        {/* Floating capsules animation */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
            className="absolute w-8 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="max-w-2xl w-full"
        >
          <Card className="p-12 bg-white/90 backdrop-blur-2xl shadow-2xl border-2 border-teal-100">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mb-8"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto relative">
                {/* Animated pulse rings */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-teal-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-cyan-400 rounded-full"
                />
                <FileCheck className="w-16 h-16 text-white relative z-10" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Account Successfully Created!
              </h1>
              <p className="text-xl text-gray-600">
                Please wait for admin approval before accessing the platform
              </p>
            </motion.div>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">Account Status</h3>
                    <p className="text-orange-700 font-medium">Pending Approval{dots}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Information Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-4 mb-8"
            >
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Document Verification</h4>
                  <p className="text-sm text-blue-700">
                    Our team is verifying your submitted licenses and documents to ensure platform security.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-teal-900 mb-1">Login After Approval</h4>
                  <p className="text-sm text-teal-700">
                    You will be able to log in and access your dashboard once your account has been approved.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Verification Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 text-white text-center mb-6"
            >
              <h3 className="text-lg font-semibold mb-2">What happens next?</h3>
              <p className="text-sm opacity-90">
                Our admin team typically reviews and approves accounts within 24-48 hours. 
                You'll receive an email notification once your account is verified.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => onNavigate('landing')}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-6"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => onNavigate('login')}
                variant="outline"
                className="flex-1 py-6"
              >
                Go to Login
              </Button>
            </motion.div>

            {/* Additional Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-500">
                Need help? Contact us at{' '}
                <a href="mailto:support@medisync.com" className="text-teal-600 hover:underline">
                  support@medisync.com
                </a>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
