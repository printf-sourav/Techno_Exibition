import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackagePlus, Hash, Calendar, IndianRupee, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';
import { createInventoryApi } from '../../lib/api';

type AddInventoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void | Promise<void>;
};

const initialForm = {
  name: '',
  batchNumber: '',
  quantity: '',
  expiryDate: '',
  mrp: '',
  gstPercent: '18',
};

export function AddInventoryModal({ isOpen, onClose, onAdded }: AddInventoryModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    const quantity = Number(form.quantity);
    const mrp = Number(form.mrp);
    const gstPercent = Number(form.gstPercent || 18);

    if (!form.name.trim() || !form.batchNumber.trim() || !form.expiryDate) {
      toast.error('Medicine name, batch number and expiry date are required');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (!Number.isFinite(mrp) || mrp < 0) {
      toast.error('MRP must be a non-negative number');
      return;
    }

    if (!Number.isFinite(gstPercent) || gstPercent < 0) {
      toast.error('GST must be a non-negative number');
      return;
    }

    const parsedDate = new Date(form.expiryDate);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('Please enter a valid expiry date');
      return;
    }

    try {
      setSubmitting(true);

      await createInventoryApi(token, {
        name: form.name.trim(),
        batchNumber: form.batchNumber.trim(),
        quantity,
        expiryDate: form.expiryDate,
        mrp,
        gstPercent,
      });

      toast.success('Medicine added to inventory');
      onClose();
      resetForm();
      await onAdded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add inventory item';
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
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <PackagePlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add Medicine</h2>
                  <p className="text-sm text-gray-500">Create a new inventory record</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="medicine-name">Medicine Name</Label>
                <Input
                  id="medicine-name"
                  value={form.name}
                  onChange={(event) => handleInputChange('name', event.target.value)}
                  placeholder="e.g. Metformin 850mg"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="batch-number">Batch Number</Label>
                <div className="relative mt-2">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="batch-number"
                    value={form.batchNumber}
                    onChange={(event) => handleInputChange('batchNumber', event.target.value)}
                    placeholder="e.g. MET-2-002"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(event) => handleInputChange('quantity', event.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="expiry-date"
                      type="date"
                      value={form.expiryDate}
                      onChange={(event) => handleInputChange('expiryDate', event.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mrp">MRP</Label>
                  <div className="relative mt-2">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="mrp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.mrp}
                      onChange={(event) => handleInputChange('mrp', event.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gst">GST %</Label>
                  <div className="relative mt-2">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="gst"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.gstPercent}
                      onChange={(event) => handleInputChange('gstPercent', event.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {submitting ? 'Adding...' : 'Add Medicine'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
