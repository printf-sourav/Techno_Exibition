import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlusCircle, AlertCircle, Send, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest?: (payload: {
    medicineName: string;
    quantity: number;
    priority: 'low' | 'medium' | 'high';
  }) => Promise<void>;
}

export function CreateRequestModal({ isOpen, onClose, onSubmitRequest }: CreateRequestModalProps) {
  const [formData, setFormData] = useState({
    medicineName: '',
    quantity: '',
    requiredBefore: '',
    priority: 'Medium',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medicineName || !formData.quantity || !formData.requiredBefore) {
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

      toast.success('Request created and sent to nearby retailers.', {
        duration: 4000,
      });

      onClose();
      setFormData({
        medicineName: '',
        quantity: '',
        requiredBefore: '',
        priority: 'Medium',
        notes: '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create request';
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
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white relative overflow-hidden">
                <motion.div
                  animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"
                />
                <motion.div
                  animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl">Create Request</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-purple-100 text-sm">Submit a new medicine request</p>
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
                    placeholder="e.g., Amoxicillin 500mg"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity Needed *</Label>
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
                  <Label htmlFor="requiredBefore">Required Before Date *</Label>
                  <div className="relative mt-2">
                    <Input
                      id="requiredBefore"
                      type="date"
                      value={formData.requiredBefore}
                      onChange={(e) => setFormData({ ...formData, requiredBefore: e.target.value })}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-2 w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Optional Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information or requirements..."
                    rows={3}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-700">
                    This request will be broadcasted to all nearby retailers in your network.
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
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 gap-2"
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
