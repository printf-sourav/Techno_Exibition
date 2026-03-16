import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

type Medicine = {
  id: number;
  name: string;
  batch: string;
  quantity: number;
};

type DonateToNGOModalProps = {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
};

const registeredNGOs = [
  { id: 1, name: 'Health for All Foundation', verified: true },
  { id: 2, name: 'Medical Aid Network', verified: true },
  { id: 3, name: 'Community Care Initiative', verified: true },
  { id: 4, name: 'Hope Healthcare Trust', verified: true },
];

export function DonateToNGOModal({ isOpen, onClose, medicine }: DonateToNGOModalProps) {
  const [donationPackets, setDonationPackets] = useState('');
  const [selectedNGO, setSelectedNGO] = useState('');

  if (!medicine) return null;

  const isQuantityValid = Number(donationPackets) > 0 && Number(donationPackets) <= medicine.quantity;

  const handleSendRequest = () => {
    if (!isQuantityValid || !selectedNGO) {
      toast.error('Please fill all fields correctly');
      return;
    }

    const ngo = registeredNGOs.find(n => n.id.toString() === selectedNGO);
    
    toast.success('Donation request sent!', {
      description: `Your donation request has been sent to ${ngo?.name}. You will be notified once they accept.`,
      duration: 5000,
    });

    onClose();
    setDonationPackets('');
    setSelectedNGO('');
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
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Donate to NGO</h2>
                  <p className="text-sm text-gray-500">Support healthcare initiatives</p>
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
              <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Medicine Name</p>
                    <p className="font-semibold">{medicine.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Batch Number</p>
                    <p className="font-medium">{medicine.batch}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Available Quantity</p>
                    <p className="font-medium">{medicine.quantity} packets</p>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <Label htmlFor="donation-packets">Number of Packets to Donate</Label>
                <div className="relative mt-2">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="donation-packets"
                    type="number"
                    value={donationPackets}
                    onChange={(e) => setDonationPackets(e.target.value)}
                    placeholder="Enter quantity to donate"
                    className="pl-10"
                    min="1"
                    max={medicine.quantity}
                  />
                </div>
                {donationPackets && !isQuantityValid && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Quantity must be between 1 and {medicine.quantity}
                  </p>
                )}
              </div>

              {/* Select NGO */}
              <div>
                <Label htmlFor="ngo">Select NGO</Label>
                <Select value={selectedNGO} onValueChange={setSelectedNGO}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a registered NGO" />
                  </SelectTrigger>
                  <SelectContent>
                    {registeredNGOs.map((ngo) => (
                      <SelectItem key={ngo.id} value={ngo.id.toString()}>
                        <div className="flex items-center gap-2">
                          {ngo.name}
                          {ngo.verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Donation Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Tax Benefits Available</p>
                    <p className="text-xs text-blue-700">
                      Your donation to registered NGOs is eligible for tax deduction under Section 80G. 
                      You'll receive a digital certificate after the NGO accepts your donation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {donationPackets && isQuantityValid && selectedNGO && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <h3 className="font-semibold mb-2 text-green-900">Donation Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medicine:</span>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{donationPackets} packets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">NGO:</span>
                      <span className="font-medium">{registeredNGOs.find(n => n.id.toString() === selectedNGO)?.name}</span>
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
                  onClick={handleSendRequest}
                  disabled={!isQuantityValid || !selectedNGO}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Send Donation Request
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
