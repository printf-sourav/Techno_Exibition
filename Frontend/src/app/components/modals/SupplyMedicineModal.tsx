import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Building2, DollarSign, AlertCircle, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

type HospitalDemand = {
  id: number;
  hospital: string;
  medicine: string;
  quantity: number;
  distance: string;
  urgency: string;
  mrp?: number;
};

type SupplyMedicineModalProps = {
  isOpen: boolean;
  onClose: () => void;
  demand: HospitalDemand | null;
};

export function SupplyMedicineModal({ isOpen, onClose, demand }: SupplyMedicineModalProps) {
  const [pricePerPacket, setPricePerPacket] = useState('');

  if (!demand) return null;

  const mrp = demand.mrp || 120;
  const isPriceValid = Number(pricePerPacket) > 0 && Number(pricePerPacket) <= mrp;
  const totalPrice = demand.quantity * Number(pricePerPacket);

  const handleConfirm = () => {
    if (!isPriceValid) {
      toast.error('Please enter a valid price');
      return;
    }

    toast.success('Supply confirmed!', {
      description: `Transport scheduled for pickup. ${demand.quantity} packets will be delivered to ${demand.hospital}.`,
      duration: 5000,
    });

    onClose();
    setPricePerPacket('');
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Supply Medicine to Hospital</h2>
                  <p className="text-sm text-gray-500">Respond to demand request</p>
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
              {/* Demand Details */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Hospital</p>
                    <p className="font-semibold">{demand.hospital}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Distance</p>
                    <p className="font-medium">{demand.distance}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Medicine Requested</p>
                    <p className="font-medium">{demand.medicine}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Requested Quantity</p>
                    <p className="font-medium">{demand.quantity} packets</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Max Price (MRP)</p>
                    <p className="font-medium">₹{mrp.toFixed(2)} per packet</p>
                  </div>
                </div>
              </div>

              {/* Price Input */}
              <div>
                <Label htmlFor="supply-price">Selling Price per Packet</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="supply-price"
                    type="number"
                    value={pricePerPacket}
                    onChange={(e) => setPricePerPacket(e.target.value)}
                    placeholder="Enter your selling price"
                    className="pl-10"
                    step="0.01"
                  />
                </div>
                {pricePerPacket && !isPriceValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Price must be less than or equal to MRP (₹{mrp.toFixed(2)})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  * Price must be competitive and below MRP to ensure hospital acceptance
                </p>
              </div>

              {/* Summary */}
              {pricePerPacket && isPriceValid && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <h3 className="font-semibold mb-2 text-green-900">Supply Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medicine:</span>
                      <span className="font-medium">{demand.medicine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{demand.quantity} packets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per packet:</span>
                      <span className="font-medium">₹{Number(pricePerPacket).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-green-700 pt-2 border-t border-green-200">
                      <span>Total Revenue:</span>
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
                  disabled={!isPriceValid}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Confirm Supply
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
