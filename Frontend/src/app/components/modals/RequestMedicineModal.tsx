import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, AlertCircle, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface RequestMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineName?: string;
  onSubmitRequest?: (payload: {
    medicineName: string;
    quantity: number;
    priority: 'low' | 'medium' | 'high';
  }) => Promise<void>;
}

export function RequestMedicineModal({
  isOpen,
  onClose,
  medicineName,
  onSubmitRequest,
}: RequestMedicineModalProps) {
  const [formData, setFormData] = useState({
    medicineName: medicineName || '',
    quantity: '',
    priority: 'Medium',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      medicineName: medicineName || prev.medicineName,
    }));
  }, [isOpen, medicineName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medicineName || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (onSubmitRequest) {
        await onSubmitRequest({
          medicineName: formData.medicineName.trim(),
          quantity: Number(formData.quantity),
          priority: formData.priority.toLowerCase() as 'low' | 'medium' | 'high',
        });
      }

      toast.success('Medicine request sent successfully. Nearby retailers have been notified.', {
        duration: 4000,
      });

      onClose();
      setFormData({ medicineName: '', quantity: '', priority: 'Medium', notes: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send request';
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl">Request Medicine</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-blue-100 text-sm">Request from nearby retailers</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="medicineName">Medicine Name *</Label>
                  <Input
                    id="medicineName"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    placeholder="e.g., Metformin 850mg"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity Required *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-2 w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Your request will be sent to nearby retailers who can fulfill this order.
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending...' : 'Send Request'}
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