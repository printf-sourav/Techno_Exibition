import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Building2, Package, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { createMarketplaceOfferApi } from '../../lib/api';

type Medicine = {
  id: string;
  name: string;
  batch: string;
  quantity: number;
  mrp?: number;
  gst?: number;
};

type SellToHospitalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
};

const nearbyHospitals = [
  { id: 1, name: 'City General Hospital', distance: '2.3 km' },
  { id: 2, name: 'St. Mary Medical Center', distance: '4.7 km' },
  { id: 3, name: 'Regional Health Clinic', distance: '3.1 km' },
  { id: 4, name: 'Metro Hospital', distance: '5.2 km' },
];

export function SellToHospitalModal({ isOpen, onClose, medicine }: SellToHospitalModalProps) {
  const { token } = useAuth();
  const [packets, setPackets] = useState('');
  const [pricePerPacket, setPricePerPacket] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!medicine) return null;

  const mrp = medicine.mrp || 150;
  const gst = medicine.gst || 18;
  const maxPrice = mrp + (mrp * gst / 100);
  const totalPrice = Number(packets) * Number(pricePerPacket);
  const isPriceValid = Number(pricePerPacket) > 0 && Number(pricePerPacket) <= maxPrice;
  const isQuantityValid = Number(packets) > 0 && Number(packets) <= medicine.quantity;

  const handleConfirm = async () => {
    if (!isPriceValid || !isQuantityValid) {
      toast.error('Please fill all fields correctly');
      return;
    }

    if (!token) {
      toast.error('Please login again to continue');
      return;
    }

    setSubmitting(true);

    try {
      await createMarketplaceOfferApi(token, {
        inventoryItemId: medicine.id,
        medicineName: medicine.name,
        batchNumber: medicine.batch,
        quantity: Number(packets),
        pricePerPacket: Number(pricePerPacket),
      });

      toast.success('Offer published in hospital marketplace', {
        description: 'Nearby hospitals can now view and accept this offer.',
        duration: 5000,
      });

      onClose();
      setPackets('');
      setPricePerPacket('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create offer';
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
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Sell to Nearby Hospital</h2>
                  <p className="text-sm text-gray-500">Configure sale details</p>
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
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Medicine</p>
                    <p className="font-semibold">{medicine.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Batch Number</p>
                    <p className="font-medium">{medicine.batch}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available Quantity</p>
                    <p className="font-medium">{medicine.quantity} packets</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Price</p>
                    <p className="font-medium">₹{maxPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="packets">Number of Packets to Sell</Label>
                <div className="relative mt-2">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="packets"
                    type="number"
                    value={packets}
                    onChange={(e) => setPackets(e.target.value)}
                    placeholder="Enter quantity"
                    className="pl-10"
                    min="1"
                    max={medicine.quantity}
                  />
                </div>
                {packets && !isQuantityValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Quantity must be between 1 and {medicine.quantity}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Price per Packet</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    value={pricePerPacket}
                    onChange={(e) => setPricePerPacket(e.target.value)}
                    placeholder="Enter price"
                    className="pl-10"
                    step="0.01"
                  />
                </div>
                {pricePerPacket && !isPriceValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Price must be less than MRP + GST (₹{maxPrice.toFixed(2)})
                  </p>
                )}
              </div>

              {/* Summary */}
              {packets && pricePerPacket && isPriceValid && isQuantityValid && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <h3 className="font-semibold mb-2 text-green-900">Sale Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medicine:</span>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packets:</span>
                      <span className="font-medium">{packets}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-green-700 pt-2 border-t border-green-200">
                      <span>Total Price:</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
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
                  onClick={handleConfirm}
                  disabled={!isPriceValid || !isQuantityValid || submitting}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {submitting ? 'Publishing...' : 'Request Order to Hospitals'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}