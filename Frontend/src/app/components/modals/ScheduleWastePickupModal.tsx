import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Calendar as CalendarIcon, Clock, Package, AlertCircle, FileCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { createWastePickupApi } from '../../lib/api';

type Medicine = {
  id: number;
  name: string;
  batch: string;
  quantity?: number;
};

type ScheduleWastePickupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  onCreated?: () => void;
};

export function ScheduleWastePickupModal({ isOpen, onClose, medicine, onCreated }: ScheduleWastePickupModalProps) {
  const { token, user } = useAuth();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteUnit, setWasteUnit] = useState<'kg' | 'packets'>('packets');
  const [submitting, setSubmitting] = useState(false);

  if (!medicine) return null;

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  const isDateValid = pickupDate !== '' && new Date(pickupDate) >= new Date(today);
  const isTimeValid = pickupTime !== '';
  const isAmountValid = Number(wasteAmount) > 0;
  const isFormValid = isDateValid && isTimeValid && isAmountValid;

  const handleSchedule = async () => {
    if (!isFormValid) {
      toast.error('Please fill all fields correctly');
      return;
    }

    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    try {
      setSubmitting(true);
      await createWastePickupApi(token, {
        wasteType: medicine.name,
        amount: Number(wasteAmount),
        unit: wasteUnit,
        pickupDate,
        pickupTime,
        location: user?.organizationName || user?.address || 'Retailer location',
      });

      toast.success('Pickup scheduled successfully!', {
        description: `Pickup has been scheduled for ${new Date(pickupDate).toLocaleDateString()}. A digital compliance certificate will be issued after disposal.`,
        duration: 6000,
      });

      onClose();
      setPickupDate('');
      setPickupTime('');
      setWasteAmount('');
      onCreated?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to schedule pickup';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Schedule Waste Pickup</h2>
                  <p className="text-sm text-gray-500">Biomedical waste disposal</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Medicine Details */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Medicine Name</p>
                    <p className="font-semibold">{medicine.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Batch Number</p>
                    <p className="font-medium">{medicine.batch}</p>
                  </div>
                </div>
              </div>

              {/* Pickup Date */}
              <div>
                <Label htmlFor="pickup-date">Pickup Date</Label>
                <div className="relative mt-2">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="pickup-date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={today}
                    className="pl-10"
                  />
                </div>
                {pickupDate && !isDateValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Pickup date cannot be in the past
                  </p>
                )}
              </div>

              {/* Pickup Time */}
              <div>
                <Label htmlFor="pickup-time">Pickup Time</Label>
                <div className="relative mt-2">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="pickup-time"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Business hours: 9:00 AM - 6:00 PM
                </p>
              </div>

              {/* Waste Amount */}
              <div>
                <Label htmlFor="waste-amount">Amount of Waste</Label>
                <div className="flex gap-3 mt-2">
                  <div className="flex-1 relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="waste-amount"
                      type="number"
                      value={wasteAmount}
                      onChange={(e) => setWasteAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="pl-10"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setWasteUnit('packets')}
                      className={`px-4 py-2 rounded-md text-sm transition-all ${
                        wasteUnit === 'packets'
                          ? 'bg-white shadow-sm font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      Packets
                    </button>
                    <button
                      type="button"
                      onClick={() => setWasteUnit('kg')}
                      className={`px-4 py-2 rounded-md text-sm transition-all ${
                        wasteUnit === 'kg'
                          ? 'bg-white shadow-sm font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      Kg
                    </button>
                  </div>
                </div>
                {wasteAmount && !isAmountValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Amount must be greater than 0
                  </p>
                )}
              </div>

              {/* Compliance Notice */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-medium mb-1">Compliance Certificate</p>
                    <p className="text-xs text-green-700">
                      A digital compliance certificate will be issued after proper disposal, 
                      as per Biomedical Waste Management Rules 2016. This certificate is valid 
                      for regulatory audits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {isFormValid && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
                >
                  <h3 className="font-semibold mb-2 text-blue-900">Pickup Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medicine:</span>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled Date:</span>
                      <span className="font-medium">{new Date(pickupDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled Time:</span>
                      <span className="font-medium">{pickupTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waste Amount:</span>
                      <span className="font-medium">{wasteAmount} {wasteUnit}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={!isFormValid || submitting}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {submitting ? 'Scheduling...' : 'Schedule Pickup'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
