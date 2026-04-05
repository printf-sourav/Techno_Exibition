import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ReschedulePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReschedule?: (payload: {
    pickupDate: string;
    pickupTime: string;
    location?: string;
    notes?: string;
  }) => Promise<void>;
  pickup?: {
    id: string;
    date: string;
    time: string;
    facility: string;
    location?: string;
  };
}

export function ReschedulePickupModal({ isOpen, onClose, pickup, onSubmitReschedule }: ReschedulePickupModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      setSubmitting(true);

      if (onSubmitReschedule) {
        await onSubmitReschedule({
          pickupDate: formData.date,
          pickupTime: formData.time,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
      }

      toast.success('Waste pickup schedule has been updated.', {
        duration: 4000,
      });

      onClose();
      setFormData({ date: '', time: '', location: '', notes: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reschedule pickup';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-slate-700 p-6 text-white relative overflow-hidden">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl">Reschedule Pickup</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm">Update waste collection schedule</p>
                </div>
              </div>

              {/* Current Pickup Info */}
              {pickup && (
                <div className="p-4 mx-6 mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{pickup.facility}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{pickup.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{pickup.time}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="date">New Date *</Label>
                  <div className="relative mt-2">
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="time">Time Slot *</Label>
                  <div className="relative mt-2">
                    <select
                      id="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      required
                    >
                      <option value="">Select time slot</option>
                      <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                    </select>
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Reason for rescheduling or special instructions..."
                    rows={3}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Updated Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder={pickup?.location || 'Enter updated location'}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Rescheduling will notify the waste management facility. Please ensure availability.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-gray-800 to-slate-700 hover:from-gray-900 hover:to-slate-800 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
